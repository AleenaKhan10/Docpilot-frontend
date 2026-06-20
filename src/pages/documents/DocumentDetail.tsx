import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import DocumentView from "../../components/doc/DocumentView";
import DocumentEditor from "../../components/doc/DocumentEditor";
import ProcessingTimeline from "../../components/doc/ProcessingTimeline";
import ShareDialog from "../../components/doc/ShareDialog";
import Button from "../../components/ui/Button";
import { sampleDocument } from "../../lib/doc-types";
import { useOrg } from "../../contexts/OrgContext";
import { api, ApiError } from "../../lib/api";
import { queryKeys } from "../../lib/query-client";
import { videoToDocument } from "../../lib/doc-mapper";
import { useVideoProgress } from "../../lib/use-video-progress";
import type { Document } from "../../lib/doc-types";
import type { BackendVideoDetail } from "../../lib/video-types";

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeOrg } = useOrg();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [shareOpen, setShareOpen] = useState(false);

  const isSample = id === "sample";
  const numericId = id && !isSample ? Number(id) : undefined;

  const videoQuery = useQuery({
    queryKey: id ? queryKeys.video(Number(id)) : ["video", "none"],
    queryFn: () => api<BackendVideoDetail>(`/api/v1/videos/${id}`),
    // Don't fetch for the local "sample" doc — it lives entirely in code.
    enabled: Boolean(id) && !isSample,
  });

  const video = videoQuery.data ?? null;

  // Derive the editor-shaped Document from the fetched video. Prefer the
  // rich Pass-2 document_json when present; fall back to the heuristic
  // mapper over flat steps for legacy videos. Memoised so re-renders
  // triggered by background refetches don't churn the editor.
  const doc = useMemo<Document | null>(() => {
    if (isSample) return sampleDocument;
    if (!video) return null;
    if (video.document_json && typeof video.document_json === "object") {
      const dj = video.document_json as Partial<Document>;
      return {
        ...videoToDocument(video),
        title: dj.title || video.title || "Untitled document",
        summary: dj.summary || "",
        output_type: (dj.output_type as Document["output_type"]) || "sop",
        sections: dj.sections || [],
      };
    }
    return videoToDocument(video);
  }, [video, isSample]);

  // Per-document edit/manage rights are decided by the backend (which
  // checks org role + doc owner + explicit grants) and surfaced as
  // video.your_access. Org owners and doc owners both get "owner". Editor
  // grants get "edit".
  const access = video?.your_access ?? null;
  const canEdit = access === "owner" || access === "edit";
  const canManageSharing = access === "owner";

  // Live progress subscription, only while the worker is in-flight.
  const isInFlight =
    video?.status === "pending" || video?.status === "processing";
  const {
    event: progressEvent,
    connected,
    terminal,
    error: wsError,
  } = useVideoProgress(numericId, Boolean(isInFlight));

  // When the worker reports terminal status, invalidate the video query
  // so the page transitions out of the processing banner without a manual
  // refresh. The tiny debounce gives the worker's final DB commit a
  // moment to land before react-query re-fetches.
  useEffect(() => {
    if (!terminal || !id) return;
    const t = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.video(Number(id)) });
    }, 800);
    return () => clearTimeout(t);
  }, [terminal, id, queryClient]);

  const saveMutation = useMutation({
    mutationFn: (next: Document) => {
      if (!id || isSample) return Promise.resolve(null);
      return api(`/api/v1/videos/${id}/document`, {
        method: "PUT",
        body: {
          title: next.title,
          summary: next.summary,
          output_type: next.output_type,
          sections: next.sections,
        },
      });
    },
    onSuccess: () => {
      if (!id) return;
      // Re-pull so any backend-side image URL refresh is reflected, and
      // bust the videos list cache so the dashboard / all-docs columns
      // (title, updated_at) reflect the edit.
      queryClient.invalidateQueries({ queryKey: queryKeys.video(Number(id)) });
      if (activeOrg) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.videos(activeOrg.id),
        });
      }
      setMode("view");
    },
  });

  const handleSave = async (next: Document) => {
    if (isSample) {
      // Sample doc isn't persisted — fake a save so the editor returns
      // to view mode without hitting the API.
      setMode("view");
      return;
    }
    // mutateAsync (vs mutate) so the editor can await the round-trip
    // before clearing its dirty state. onSuccess still flips mode -> view.
    await saveMutation.mutateAsync(next);
  };

  const breadcrumbs = [
    { label: activeOrg?.name ?? "Workspace" },
    { label: "Documents", to: "/documents" },
    { label: doc?.title ?? video?.title ?? "Document" },
  ];

  // Only show the spinner on the *initial* load — background refetches
  // (e.g. after invalidateQueries on terminal WS event) keep the current
  // page visible until the new data lands.
  const initialLoading = videoQuery.isLoading && !video && !isSample;
  if (initialLoading) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="text-t4 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const loadError =
    videoQuery.error instanceof ApiError
      ? videoQuery.error.detail
      : videoQuery.error
      ? "Failed to load document."
      : "";

  if (loadError || !doc) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <div className="px-6 py-12 max-w-md mx-auto text-center">
          <AlertTriangle size={20} className="mx-auto text-err-fg mb-3" />
          <div className="text-[14px] text-t1 font-medium mb-1">
            Couldn't load document
          </div>
          <div className="font-mono text-[10px] text-t5 mb-5">
            {loadError || "Unknown error"}
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
              Something went wrong while generating this document. The most
              common cause is a misconfigured VLM API key on the server. Check
              the backend logs, then re-upload the video.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/documents")}
            >
              Back to all documents
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const saveError =
    saveMutation.error instanceof ApiError
      ? saveMutation.error.detail
      : saveMutation.error
      ? "Failed to save."
      : null;

  if (mode === "edit") {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <DocumentEditor
          document={doc}
          videoId={numericId}
          saving={saveMutation.isPending}
          error={saveError}
          onSave={handleSave}
          onCancel={() => {
            saveMutation.reset();
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
