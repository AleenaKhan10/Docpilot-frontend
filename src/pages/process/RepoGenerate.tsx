import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Github, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import Button from "../../components/ui/Button";
import Pill from "../../components/ui/Pill";
import { useOrg } from "../../contexts/OrgContext";
import { api, ApiError } from "../../lib/api";

type RepoDocOutputType = "product_overview" | "dev_reference" | "user_guide";

const OUTPUT_TYPES: { value: RepoDocOutputType; label: string; desc: string }[] = [
  {
    value: "user_guide",
    label: "User Guide",
    desc: "For end users of the product. Task-based, written in plain language. No code, file names, ports, or libraries — only what the user sees and does.",
  },
  {
    value: "product_overview",
    label: "Product Overview",
    desc: "For PMs, execs, or clients. Features, integrations, limits, gaps. Business framing — no implementation detail.",
  },
  {
    value: "dev_reference",
    label: "Developer Reference",
    desc: "For engineers reading or extending the code. Tech stack with versions, routes/API endpoints, entry points, environment, how to run.",
  },
];

type GenerateResponse = {
  document_id: string;
  source_id: string;
  output_type: string;
  title: string;
  content: Record<string, unknown>;
};

type DocListItem = {
  id: string;
  source_id: string;
  source_label: string;
  output_type: string;
  title: string | null;
  updated_at: string | null;
  view_path: string;
};

const RepoGenerate = () => {
  const { sourceId } = useParams();
  const { activeOrg } = useOrg();
  const queryClient = useQueryClient();

  const [outputType, setOutputType] = useState<RepoDocOutputType>("user_guide");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<GenerateResponse | null>(null);

  // What's already been generated for THIS source?
  const { data: allRepoDocs = [] } = useQuery<DocListItem[]>({
    queryKey: ["documents", "repo", activeOrg?.id],
    queryFn: () => api<DocListItem[]>("/api/v1/documents/?source_type=repo"),
    enabled: !!activeOrg,
  });
  const existingForSource = allRepoDocs.filter((d) => d.source_id === sourceId);
  const existingByType = new Map(existingForSource.map((d) => [d.output_type, d]));
  const sourceLabel = existingForSource[0]?.source_label;

  // Default the selected output_type to the first one that doesn't yet exist.
  useEffect(() => {
    if (existingForSource.length === 0) return;
    if (!existingByType.has("user_guide")) setOutputType("user_guide");
    else if (!existingByType.has("product_overview")) setOutputType("product_overview");
    else if (!existingByType.has("dev_reference")) setOutputType("dev_reference");
  }, [existingForSource.length]);

  const generate = async () => {
    if (!sourceId || generating) return;
    setGenerating(true);
    setError("");
    setResult(null);
    try {
      const resp = await api<GenerateResponse>(
        `/api/v1/sources/${sourceId}/documents`,
        { method: "POST", body: { output_type: outputType } }
      );
      setResult(resp);
      // Refresh the repo-docs list so the newly-generated doc shows up as
      // 'already generated' here and in the library sidebar.
      queryClient.invalidateQueries({ queryKey: ["documents", "repo", activeOrg?.id] });
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <MainLayout
      breadcrumbs={[
        { label: activeOrg?.name ?? "Workspace" },
        { label: "Generate from repo" },
      ]}
    >
      <div className="px-6 py-6 max-w-[900px] mx-auto">
        <div className="mb-6 flex items-start gap-3">
          <div className="w-9 h-9 bg-s2 border border-l2 rounded-md flex items-center justify-center flex-shrink-0">
            <Github size={18} className="text-t2" />
          </div>
          <div>
            <h1 className="font-serif font-normal text-[38px] tracking-tight text-t1 leading-[1.05] mb-2">
              Generate from repository
            </h1>
            {sourceLabel && (
              <div className="font-mono text-[11px] text-t3">{sourceLabel}</div>
            )}
          </div>
        </div>

        <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-t5 mb-2.5">
          Document type
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
          {OUTPUT_TYPES.map((t) => {
            const selected = outputType === t.value;
            const existing = existingByType.get(t.value);
            return (
              <div
                key={t.value}
                className={[
                  "bg-s1 border rounded-md p-4 transition",
                  selected ? "border-white bg-s3" : "border-l1 hover:bg-s2 hover:border-l3",
                  generating ? "opacity-50" : "",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => setOutputType(t.value)}
                  disabled={generating}
                  className="w-full text-left disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[13px] font-semibold text-t1">{t.label}</div>
                    {existing && (
                      <Pill variant="ok">
                        <Check size={9} className="inline mr-0.5" /> Generated
                      </Pill>
                    )}
                  </div>
                  <div className="text-[11px] text-t4 leading-[1.55]">{t.desc}</div>
                </button>
                {existing && (
                  <div className="mt-3 pt-3 border-t border-l1 flex items-center gap-2">
                    <Link
                      to={existing.view_path}
                      className="font-mono text-[10px] text-accent hover:underline"
                    >
                      View current →
                    </Link>
                    <span className="font-mono text-[9px] text-t5">
                      {existing.updated_at
                        ? `updated ${new Date(existing.updated_at).toLocaleDateString()}`
                        : "just generated"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 rounded-sm border border-err-line bg-err-bg/40 px-3.5 py-2.5 font-mono text-[10px] text-err-fg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-5 border-t border-l1">
          <Button
            variant="primary"
            disabled={generating}
            onClick={generate}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Generating…
              </span>
            ) : existingByType.has(outputType) ? (
              "Regenerate"
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        {result && (
          <div className="mt-8 rounded-md border border-ok-line bg-ok-bg/30 p-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-ok-fg mb-1">
                Generated
              </div>
              <div className="text-[14px] font-semibold text-t1">{result.title}</div>
            </div>
            <Link to={`/documents/repo/${result.document_id}`}>
              <Button variant="primary" size="sm">
                Open document
              </Button>
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default RepoGenerate;
