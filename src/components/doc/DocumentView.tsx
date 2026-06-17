import { useMemo, useState } from "react";
import { Download, Edit3, Share2 } from "lucide-react";
import Button from "../ui/Button";
import Pill from "../ui/Pill";
import BlockRenderer from "./BlockRenderer";
import type { Document, DocOutputType } from "../../lib/doc-types";

const OUTPUT_LABEL: Record<DocOutputType, string> = {
  sop: "Standard Operating Procedure",
  training: "Training Module",
  bug_report: "Bug Report",
  changelog: "Changelog",
  audit: "Audit Trail",
  client_handover: "Client Handover",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const fmtDuration = (s?: number) => {
  if (!s) return null;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
};

const fmtBytes = (b?: number) => {
  if (!b) return null;
  const mb = b / 1_000_000;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(b / 1000).toFixed(0)} KB`;
};

interface DocumentViewProps {
  document: Document;
  mode?: "view" | "edit";
  onEdit?: () => void;
  onExport?: () => void;
  onShare?: () => void;
}

const DocumentView = ({
  document,
  mode = "view",
  onEdit,
  onExport,
  onShare,
}: DocumentViewProps) => {
  const [activeSection, setActiveSection] = useState<string>(
    document.sections[0]?.id ?? ""
  );

  const meta = useMemo(
    () => [
      { k: "Document type", v: OUTPUT_LABEL[document.output_type] },
      { k: "Created", v: fmtDate(document.created_at) },
      { k: "Updated", v: fmtDate(document.updated_at) },
      { k: "Source video", v: fmtDuration(document.source_duration_seconds) ?? "—" },
      { k: "Source size", v: fmtBytes(document.source_size_bytes) ?? "—" },
      { k: "Author", v: document.author ?? "—" },
    ],
    [document]
  );

  return (
    <div className="flex gap-6 px-6 py-6 max-w-[1400px] mx-auto">
      {/* Outline */}
      <aside className="w-[200px] flex-shrink-0 sticky top-6 self-start hidden lg:block">
        <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-t5 mb-3">
          On this page
        </div>
        <nav className="flex flex-col">
          {document.sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              className={[
                "text-[12px] py-1.5 px-2 rounded-sm border-l-2 transition",
                activeSection === s.id
                  ? "text-t1 border-white bg-s1"
                  : "text-t4 border-transparent hover:text-t2 hover:bg-s1",
              ].join(" ")}
            >
              {s.heading}
            </a>
          ))}
        </nav>
      </aside>

      {/* Body */}
      <div className="flex-1 min-w-0 max-w-[760px]">
        {/* Header */}
        <div className="bg-s1 border border-l1 rounded-md px-6 py-5 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1.5 flex-wrap">
              <Pill variant="info">{OUTPUT_LABEL[document.output_type]}</Pill>
              {document.status === "published" && <Pill variant="ok">Published</Pill>}
              {document.status === "draft" && <Pill variant="neutral">Draft</Pill>}
              {document.status === "processing" && <Pill variant="info">Processing</Pill>}
              {document.tags?.slice(0, 3).map((t) => (
                <Pill key={t} variant="neutral">
                  {t}
                </Pill>
              ))}
            </div>
            <div className="flex gap-1.5">
              {mode === "view" && onEdit && (
                <Button variant="ghost" size="sm" icon={<Edit3 size={12} />} onClick={onEdit}>
                  Edit
                </Button>
              )}
              {onShare && (
                <Button variant="ghost" size="sm" icon={<Share2 size={12} />} onClick={onShare}>
                  Share
                </Button>
              )}
              {onExport && (
                <Button variant="primary" size="sm" icon={<Download size={12} />} onClick={onExport}>
                  Export PDF
                </Button>
              )}
            </div>
          </div>

          <h1 className="text-[22px] font-semibold tracking-tight text-white leading-tight mb-2">
            {document.title}
          </h1>
          <p className="text-[13px] text-t3 leading-relaxed">
            {document.summary}
          </p>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-l1">
            {meta.map((m) => (
              <div key={m.k}>
                <div className="font-mono text-[9px] uppercase tracking-wide text-t5">
                  {m.k}
                </div>
                <div className="font-mono text-[11px] text-t3 mt-1">{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-3">
          {document.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="bg-s1 border border-l1 rounded-md px-6 py-6 scroll-mt-6"
            >
              <h2 className="text-[16px] font-semibold tracking-tight text-white mb-1.5">
                {section.heading}
              </h2>
              {section.intro && (
                <p className="text-[12px] text-t4 mb-5 leading-relaxed">
                  {section.intro}
                </p>
              )}
              <div className="flex flex-col gap-5">
                {section.blocks.map((b) => (
                  <BlockRenderer key={b.id} block={b} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentView;
