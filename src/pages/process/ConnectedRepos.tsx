import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Github, Loader2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import Button from "../../components/ui/Button";
import Pill from "../../components/ui/Pill";
import { useOrg } from "../../contexts/OrgContext";
import { api, ApiError } from "../../lib/api";
import { DOC_OUTPUT_LABEL, type DocOutputType } from "../../lib/doc-types";

type SourceOut = {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
};

type RepoDocRow = {
  id: string;
  source_id: string;
  output_type: string;
  updated_at: string | null;
  view_path: string;
};

const ConnectedRepos = () => {
  const { activeOrg } = useOrg();
  const navigate = useNavigate();
  const [installError, setInstallError] = useState<string>("");
  const [installing, setInstalling] = useState(false);

  const canManage =
    activeOrg?.role === "owner" || activeOrg?.role === "admin";

  const { data: sources = [], isLoading: sourcesLoading } = useQuery<SourceOut[]>({
    queryKey: ["sources", activeOrg?.id],
    queryFn: () => api<SourceOut[]>("/api/v1/sources/"),
    enabled: !!activeOrg,
  });

  const { data: repoDocs = [] } = useQuery<RepoDocRow[]>({
    queryKey: ["documents", "repo", activeOrg?.id],
    queryFn: () => api<RepoDocRow[]>("/api/v1/documents/?source_type=repo"),
    enabled: !!activeOrg,
  });

  const repos = sources.filter((s) => s.type === "repo");
  const docsBySource = new Map<string, RepoDocRow[]>();
  for (const d of repoDocs) {
    const list = docsBySource.get(d.source_id) ?? [];
    list.push(d);
    docsBySource.set(d.source_id, list);
  }

  const startInstall = async () => {
    if (installing) return;
    setInstalling(true);
    setInstallError("");
    try {
      const { install_url } = await api<{ install_url: string }>(
        "/api/v1/sources/github/install-url"
      );
      window.open(install_url, "_blank", "noopener");
    } catch (e) {
      setInstallError(
        e instanceof ApiError ? e.detail : "Failed to open GitHub install."
      );
    } finally {
      setInstalling(false);
    }
  };

  return (
    <MainLayout
      breadcrumbs={[
        { label: activeOrg?.name ?? "Workspace" },
        { label: "GitHub repositories" },
      ]}
    >
      <div className="px-6 py-6 max-w-[1000px] mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-s2 border border-l2 rounded-md flex items-center justify-center flex-shrink-0">
              <Github size={18} className="text-t2" />
            </div>
            <div>
              <h1 className="font-serif font-normal text-[36px] tracking-tight text-t1 leading-[1.05] mb-2">
                GitHub repositories
              </h1>
              <p className="font-serif italic text-[16px] text-t3 leading-relaxed max-w-[56ch]">
                Repositories your organization has connected. Open one to
                generate or regenerate its product overview and developer
                reference.
              </p>
            </div>
          </div>
          {canManage && (
            <Button variant="primary" size="md" onClick={startInstall} disabled={installing}>
              {installing ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" /> Opening…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus size={13} /> {repos.length === 0 ? "Install Docpilot on GitHub" : "Add more repositories"}
                </span>
              )}
            </Button>
          )}
        </div>

        {installError && (
          <div className="mb-4 rounded-sm border border-err-line bg-err-bg/40 px-3.5 py-2.5 font-mono text-[10px] text-err-fg">
            {installError}
          </div>
        )}

        {sourcesLoading ? (
          <div className="flex items-center gap-2 text-[12px] text-t4">
            <Loader2 size={14} className="animate-spin" /> Loading connected repositories…
          </div>
        ) : repos.length === 0 ? (
          <div className="bg-s1 border border-l1 rounded-md p-8 text-center">
            <div className="text-[14px] font-semibold text-t1 mb-1">
              No repositories connected yet
            </div>
            <div className="text-[12px] text-t4 mb-4 max-w-md mx-auto">
              Install the Docpilot GitHub App on your account or organization,
              then pick which repos you want to document.
            </div>
            {canManage ? (
              <Button variant="primary" size="md" onClick={startInstall} disabled={installing}>
                {installing ? "Opening…" : "Install Docpilot on GitHub"}
              </Button>
            ) : (
              <div className="font-mono text-[10px] text-t5">
                Ask an owner or admin to connect a repository.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-s1 border border-l1 rounded-md divide-y divide-l1">
            {repos.map((s) => {
              const docs = docsBySource.get(s.id) ?? [];
              const generatedTypes = new Set(docs.map((d) => d.output_type));
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-s2 cursor-pointer"
                  onClick={() => navigate(`/process/repo/${s.id}`)}
                >
                  <Github size={14} className="text-t4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-t1 truncate">
                      {s.label}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {generatedTypes.size === 0 ? (
                        <span className="font-mono text-[10px] text-t5">
                          No docs generated yet
                        </span>
                      ) : (
                        Array.from(generatedTypes).map((t) => (
                          <Pill key={t} variant="ok">
                            {DOC_OUTPUT_LABEL[t as DocOutputType] ?? t}
                          </Pill>
                        ))
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/process/repo/${s.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-[10px] text-accent hover:underline"
                  >
                    Open →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ConnectedRepos;
