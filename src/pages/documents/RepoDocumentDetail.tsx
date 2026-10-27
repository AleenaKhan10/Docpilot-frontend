import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Github, Loader2 } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import Pill from "../../components/ui/Pill";
import { useOrg } from "../../contexts/OrgContext";
import { api, ApiError } from "../../lib/api";
import { DOC_OUTPUT_LABEL, type DocOutputType } from "../../lib/doc-types";

type RepoBlock =
  | { type: "paragraph"; text: string }
  | { type: "step"; number?: number; title: string; detail?: string }
  | { type: "callout"; kind?: "note" | "tip" | "warning" | "danger"; title?: string; text: string }
  | { type: "list"; ordered?: boolean; intro?: string; items: string[] }
  | { type: "link"; url: string; label: string; description?: string }
  | { type: "code"; language?: string; code: string; caption?: string }
  | { type: "table"; columns?: string[]; headers?: string[]; rows: string[][] }
  | {
      type: "image_grid";
      intro?: string;
      columns?: number;
      items: { url?: string; caption?: string; alt?: string }[];
    }
  | { type: string; [k: string]: unknown };

type RepoSection = {
  heading: string;
  intro?: string;
  blocks: RepoBlock[];
};

type RepoDocResponse = {
  id: string;
  source_id: string;
  source_type: string;
  source_label: string;
  output_type: string;
  title: string | null;
  content: {
    title?: string;
    summary?: string;
    output_type?: string;
    sections?: RepoSection[];
  } | null;
  created_at: string;
  updated_at: string | null;
};

const calloutColors: Record<string, string> = {
  note: "border-l1 bg-s2 text-t2",
  tip: "border-ok-line bg-ok-bg/40 text-ok-fg",
  warning: "border-warn-line bg-warn-bg/40 text-warn-fg",
  danger: "border-err-line bg-err-bg/40 text-err-fg",
};

const BlockRow = ({ block }: { block: RepoBlock }) => {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="font-serif text-[15px] text-t2 leading-[1.7] mb-4">
          {(block as { text: string }).text}
        </p>
      );
    case "step": {
      const b = block as { number?: number; title: string; detail?: string };
      return (
        <div className="flex gap-4 mb-4">
          <div className="font-mono text-[11px] text-t5 pt-1 w-6 text-right">
            {b.number ? `${b.number}.` : "•"}
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-t1 mb-0.5">{b.title}</div>
            {b.detail && (
              <div className="font-serif text-[14px] text-t3 leading-[1.65]">{b.detail}</div>
            )}
          </div>
        </div>
      );
    }
    case "callout": {
      const b = block as { kind?: string; title?: string; text: string };
      const color = calloutColors[b.kind ?? "note"] ?? calloutColors.note;
      return (
        <div className={`border rounded-md px-4 py-3 mb-4 ${color}`}>
          {b.title && <div className="text-[12px] font-semibold mb-1">{b.title}</div>}
          <div className="text-[13px] leading-[1.6]">{b.text}</div>
        </div>
      );
    }
    case "list": {
      const b = block as { ordered?: boolean; intro?: string; items: string[] };
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <div className="mb-4">
          {b.intro && (
            <div className="font-serif text-[14px] text-t2 leading-[1.6] mb-2">{b.intro}</div>
          )}
          <Tag className={`${b.ordered ? "list-decimal" : "list-disc"} pl-5 space-y-1`}>
            {b.items.map((it, i) => (
              <li key={i} className="font-serif text-[14px] text-t2 leading-[1.6]">
                {it}
              </li>
            ))}
          </Tag>
        </div>
      );
    }
    case "link": {
      const b = block as { url: string; label: string; description?: string };
      return (
        <a
          href={b.url}
          target="_blank"
          rel="noopener"
          className="block bg-s1 border border-l1 rounded-md px-4 py-3 mb-4 hover:border-l3 hover:bg-s2 transition"
        >
          <div className="text-[13px] font-semibold text-t1 mb-0.5">{b.label}</div>
          {b.description && (
            <div className="text-[11px] text-t4 mb-1">{b.description}</div>
          )}
          <div className="font-mono text-[10px] text-t5 truncate">{b.url}</div>
        </a>
      );
    }
    case "code": {
      const b = block as { language?: string; code: string; caption?: string };
      return (
        <div className="mb-4">
          {b.caption && (
            <div className="font-mono text-[9px] uppercase tracking-wide text-t5 mb-1">
              {b.caption}
            </div>
          )}
          <pre className="bg-s2 border border-l1 rounded-md p-4 text-[12px] text-t1 font-mono overflow-x-auto">
            {b.code}
          </pre>
        </div>
      );
    }
    case "image_grid": {
      const b = block as {
        intro?: string;
        columns?: number;
        items: { url?: string; caption?: string; alt?: string }[];
      };
      const items = b.items ?? [];
      const requested = b.columns ?? (items.length <= 2 ? 2 : items.length <= 6 ? 3 : 4);
      const cols = Math.max(1, Math.min(4, requested));
      const gridClass =
        cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-1 md:grid-cols-2"
        : cols === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4";
      return (
        <div className="mb-4">
          {b.intro && (
            <p className="font-serif text-[14px] text-t2 leading-[1.65] mb-3">{b.intro}</p>
          )}
          <div className={`grid ${gridClass} gap-2`}>
            {items.map((it, i) => (
              <figure
                key={i}
                className="rounded-md border border-l1 overflow-hidden bg-s1 flex flex-col"
              >
                {it.url ? (
                  <img
                    src={it.url}
                    alt={it.alt ?? it.caption ?? ""}
                    className="block w-full h-auto object-cover"
                  />
                ) : (
                  <div className="w-full aspect-video bg-s2 flex items-center justify-center font-mono text-[9px] text-t5">
                    (image unavailable)
                  </div>
                )}
                {it.caption && (
                  <figcaption className="px-2 py-1.5 text-[10px] text-t4 border-t border-l1">
                    {it.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      );
    }
    case "table": {
      const b = block as { columns?: string[]; headers?: string[]; rows: string[][] };
      const cols = b.columns ?? b.headers ?? [];
      return (
        <table className="w-full text-[13px] mb-4 border border-l1 rounded-md overflow-hidden">
          {cols.length > 0 && (
            <thead>
              <tr className="bg-s2">
                {cols.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wide text-t5 border-b border-l1"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {b.rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-bg" : "bg-s1"}>
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-t2 border-b border-l1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    default:
      return (
        <pre className="bg-s1 border border-l1 rounded-md p-3 text-[11px] text-t4 font-mono mb-4 overflow-x-auto">
          {JSON.stringify(block, null, 2)}
        </pre>
      );
  }
};

const RepoDocumentDetail = () => {
  const { id } = useParams();
  const { activeOrg } = useOrg();
  const [doc, setDoc] = useState<RepoDocResponse | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api<RepoDocResponse>(`/api/v1/documents/${id}`);
        if (!cancelled) setDoc(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.detail : "Failed to load document.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const outputLabel = doc
    ? DOC_OUTPUT_LABEL[doc.output_type as DocOutputType] ?? doc.output_type
    : "";

  return (
    <MainLayout
      breadcrumbs={[
        { label: activeOrg?.name ?? "Workspace" },
        { label: "Documents", href: "/documents" },
        { label: doc?.title ?? outputLabel ?? "Document" },
      ]}
    >
      <div className="px-6 py-6 max-w-[900px] mx-auto">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] text-t5 hover:text-t3 mb-5"
        >
          <ArrowLeft size={11} /> All documents
        </Link>

        {error && (
          <div className="rounded-sm border border-err-line bg-err-bg/40 px-3.5 py-2.5 font-mono text-[10px] text-err-fg">
            {error}
          </div>
        )}

        {!doc && !error && (
          <div className="flex items-center gap-2 text-[12px] text-t4">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        )}

        {doc && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Pill variant="neutral">{outputLabel}</Pill>
              <Pill variant="neutral">
                <Github size={9} className="inline mr-1" />
                {doc.source_label}
              </Pill>
            </div>
            <h1 className="font-serif font-normal text-[36px] tracking-tight text-t1 leading-[1.08] mb-3">
              {doc.title ?? "Untitled"}
            </h1>
            {doc.content?.summary && (
              <p className="font-serif italic text-[17px] text-t3 leading-relaxed mb-8 max-w-[62ch]">
                {doc.content.summary}
              </p>
            )}

            {(doc.content?.sections ?? []).map((section, si) => (
              <section key={si} className="mb-10">
                <h2 className="font-serif text-[22px] text-t1 tracking-tight mb-2 pb-2 border-b border-l1">
                  {section.heading}
                </h2>
                {section.intro && (
                  <p className="font-serif italic text-[15px] text-t3 leading-[1.65] mb-5">
                    {section.intro}
                  </p>
                )}
                {section.blocks.map((block, bi) => (
                  <BlockRow key={bi} block={block} />
                ))}
              </section>
            ))}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default RepoDocumentDetail;
