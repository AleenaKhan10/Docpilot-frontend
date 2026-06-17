import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import DocumentView from "../../components/doc/DocumentView";
import DocumentEditor from "../../components/doc/DocumentEditor";
import ProcessingTimeline from "../../components/doc/ProcessingTimeline";
import ShareDialog from "../../components/doc/ShareDialog";
import Button from "../../components/ui/Button";
import { sampleDocument } from "../../lib/doc-types";
import { useOrg } from "../../contexts/OrgContext";
import { api, ApiError } from "../../lib/api";
import { videoToDocument } from "../../lib/doc-mapper";
import { useVideoProgress } from "../../lib/use-video-progress";
import type { Document } from "../../lib/doc-types";
import type { BackendVideoDetail } from "../../lib/video-types";

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const [doc, setDoc] = useState<Document | null>(null);
  const [video, setVideo] = useState<BackendVideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Per-document edit/manage rights are decided by the backend (which checks
  // org role + doc owner + explicit grants) and surfaced as video.your_access.
  // Org owners and doc owners both get "owner" level. Editor grants get "edit".
  const access = video?.your_access ?? null;
  const canEdit = access === "owner" || access === "edit";
  const canManageSharing = access === "owner";

  const loadVideo = useCallback(async () => {
    if (!id) return;
    if (id === "sample") {
      setDoc(sampleDocument);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const v = await api<BackendVideoDetail>(`/api/v1/videos/${id}`);
      setVideo(v);
      // Prefer the rich Pass-2 document_json when present; fall back to
      // the heuristic mapper over flat steps for legacy videos.
      if (v.document_json && typeof v.document_json === "object") {
        const dj = v.document_json as Partial<Document>;
        setDoc({
          ...videoToDocument(v),
          title: dj.title || v.title || "Untitled document",
          summary: dj.summary || "",
          output_type: (dj.output_type as Document["output_type"]) || "sop",
          sections: dj.sections || [],
        });
      } else {
        setDoc(videoToDocument(v));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to load document.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  // Live progress subscription, only while the worker is in-flight.
  const isInFlight = video?.status === "pending" || video?.status === "processing";
  const numericId = id && id !== "sample" ? Number(id) : undefined;
  const { event: progressEvent, connected, terminal, error: wsError } = useVideoProgress(
    numericId,
    Boolean(isInFlight)
  );

  // When the worker reports terminal status (completed | failed), re-fetch
  // the video so the page transitions out of the processing banner without
  // a manual refresh.
  useEffect(() => {
    if (terminal) {
      // Tiny debounce so the worker's final DB commit lands before our re-fetch.
      const t = setTimeout(() => {
        loadVideo();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [terminal, loadVideo]);

  const breadcrumbs = [
    { label: activeOrg?.name ?? "Workspace" },
    { label: "Documents", to: "/documents" },
    { label: doc?.title ?? video?.title ?? "Document" },
  ];

  if (loading) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="text-t4 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error || !doc) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <div className="px-6 py-12 max-w-md mx-auto text-center">
          <AlertTriangle size={20} className="mx-auto text-err-fg mb-3" />
          <div className="text-[14px] text-t1 font-medium mb-1">
            Couldn't load document
          </div>
          <div className="font-mono text-[10px] text-t5 mb-5">
            {error || "Unknown error"}
          </div>
          <Button variant="ghost" onClick={() => navigate("/documents")}>
            Back to documents
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (video && isInFlight) {
    const headlineStatus =
      progressEvent?.status === "failed"
        ? "Failed"
        : video.status === "pending" && !progressEvent
        ? "Queued"
        : "Processing";
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <div className="px-6 py-12 max-w-2xl mx-auto">
          <div className="bg-s1 border border-l1 rounded-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[14px] font-medium text-t1">
                  {video.title || "Untitled video"}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-info-fg mt-1">
                  {headlineStatus}
                </div>
              </div>
            </div>
            <p className="text-[12px] text-t4 leading-relaxed mb-5">
              DocPilot is analysing the recording and writing the document.
              You can leave this tab open — it'll update on its own.
            </p>
            <ProcessingTimeline
              event={progressEvent}
              connected={connected}
              error={wsError}
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (video && video.status === "failed") {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <div className="px-6 py-12 max-w-xl mx-auto">
          <div className="bg-s1 border border-err-line rounded-md p-6 text-center">
            <AlertTriangle size={20} className="mx-auto text-err-fg mb-3" />
            <div className="text-[14px] font-medium text-t1 mb-1">
              Processing failed
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-err-fg mb-3">
              {video.title || "Untitled video"}
            </div>
            <p className="text-[12px] text-t4 leading-relaxed mb-4">
              Something went wrong while generating this document. The most common cause is a misconfigured VLM API key on the server. Check the backend logs, then re-upload the video.
            </p>
            <Button variant="ghost" size="sm" onClick={() => navigate("/documents")}>
              Back to all documents
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleSave = async (next: Document) => {
    if (!id || id === "sample") {
      // Sample doc isn't persisted.
      setDoc(next);
      setMode("view");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await api(`/api/v1/videos/${id}/document`, {
        method: "PUT",
        body: {
          title: next.title,
          summary: next.summary,
          output_type: next.output_type,
          sections: next.sections,
        },
      });
      // Re-pull so any backend-side image URL refresh is reflected.
      await loadVideo();
      setMode("view");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.detail : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (mode === "edit") {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <DocumentEditor
          document={doc}
          videoId={id && id !== "sample" ? Number(id) : undefined}
          saving={saving}
          error={saveError}
          onSave={handleSave}
          onCancel={() => {
            setSaveError(null);
            setMode("view");
          }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <DocumentView
        document={doc}
        mode={mode}
        onEdit={canEdit ? () => setMode("edit") : undefined}
        onShare={video ? () => setShareOpen(true) : undefined}
        onExport={() => {
          if (video?.pdf_url) {
            window.open(video.pdf_url, "_blank");
          } else {
            alert("PDF not ready yet.");
          }
        }}
      />
      {video && (
        <ShareDialog
          videoId={video.id}
          canManageSharing={canManageSharing}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </MainLayout>
  );
};

export default DocumentDetail;
