import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Download, FileText, Loader2 } from "lucide-react";
import DocumentView from "../../components/doc/DocumentView";
import Logo from "../../components/layout/Logo";
import type { Document } from "../../lib/doc-types";
import { videoToDocument } from "../../lib/doc-mapper";

interface SharedDocResponse {
  id: number;
  title: string;
  output_type: string;
  pdf_url: string | null;
  document_json: unknown | null;
  shared_at: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const SharePage = () => {
  const { token } = useParams<{ token: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status: number; detail: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/api/v1/share/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          let detail = `Request failed (${res.status})`;
          try {
            const j = JSON.parse(text);
            detail = j.detail ?? detail;
          } catch {}
          throw { status: res.status, detail };
        }
        return res.json() as Promise<SharedDocResponse>;
      })
      .then((data) => {
        setPdfUrl(data.pdf_url);
        const dj = data.document_json as Partial<Document> | null;
        if (dj && typeof dj === "object") {
          setDoc({
            id: String(data.id),
            title: dj.title || data.title || "Untitled document",
            summary: dj.summary || "",
            output_type:
              (dj.output_type as Document["output_type"]) ||
              (data.output_type as Document["output_type"]) ||
              "sop",
            status: "published",
            created_at: data.shared_at ?? new Date().toISOString(),
            updated_at: data.shared_at ?? new Date().toISOString(),
            sections: dj.sections || [],
          });
        } else {
          // Fallback for legacy videos without document_json.
          setDoc(
            videoToDocument({
              id: data.id,
              title: data.title,
              status: "completed",
              pdf_url: data.pdf_url,
              created_at: data.shared_at ?? new Date().toISOString(),
              document_json: null,
              steps: [],
            })
          );
        }
      })
      .catch((e) => {
        setError(
          e && typeof e === "object" && "status" in e
            ? e
            : { status: 0, detail: String(e) }
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-bg2 border-b border-l1 px-6 h-[52px] flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-white text-bg rounded-sm flex items-center justify-center">
            <Logo size={14} />
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-white">
            DocPilot
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-t5 ml-2 border border-l2 rounded-xs px-1.5 py-[2px]">
            Shared document · read-only
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] text-t3 hover:text-t1 border border-l2 hover:border-l3 rounded-sm px-2.5 py-1 inline-flex items-center gap-1.5"
            >
              <Download size={12} /> PDF
            </a>
          )}
        </div>
      </header>

      <main className="flex-1">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="text-t4 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="px-6 py-16 max-w-md mx-auto text-center">
            <AlertTriangle size={20} className="mx-auto text-err-fg mb-3" />
            <div className="text-[14px] font-medium text-t1 mb-1">
              {error.status === 404
                ? "Link not found"
                : error.status === 410
                ? "Link expired"
                : error.status === 409
                ? "Document still processing"
                : "Couldn't load document"}
            </div>
            <div className="font-mono text-[10px] text-t5 mb-6">
              {error.detail}
            </div>
            <div className="flex items-center justify-center gap-2 text-[12px] text-t4">
              <FileText size={12} />
              <span>This share link is no longer accessible.</span>
            </div>
          </div>
        )}

        {!loading && !error && doc && (
          <DocumentView
            document={doc}
            mode="view"
            onExport={
              pdfUrl ? () => window.open(pdfUrl, "_blank") : undefined
            }
          />
        )}
      </main>
    </div>
  );
};

export default SharePage;
