import { useMemo, useState } from "react";
import { Filter, Github, Loader2, Search } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import Pill from "../../components/ui/Pill";
import Button from "../../components/ui/Button";
import { useOrg } from "../../contexts/OrgContext";
import { api, ApiError } from "../../lib/api";
import { useVideos, usePrefetchVideo } from "../../hooks/useVideos";
import type { VideoStatus } from "../../lib/video-types";
import { DOC_OUTPUT_LABEL, type DocOutputType } from "../../lib/doc-types";

type RepoDocRow = {
  id: string;
  source_id: string;
  source_label: string;
  output_type: string;
  title: string | null;
  created_at: string;
  updated_at: string | null;
  view_path: string;
};

type FilterKey = "all" | "published" | "processing" | "failed";

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "All",
  published: "Published",
  processing: "Processing",
  failed: "Failed",
};

const statusPill = (status: VideoStatus) => {
  switch (status) {
    case "completed":
      return <Pill variant="ok">Published</Pill>;
    case "processing":
      return <Pill variant="info">Processing</Pill>;
    case "pending":
      return <Pill variant="neutral">Queued</Pill>;
    case "failed":
      return <Pill variant="err">Failed</Pill>;
  }
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const AllDocuments = () => {
  const { activeOrg } = useOrg();
  const navigate = useNavigate();
  const prefetchVideo = usePrefetchVideo();
  // Shares the videos cache key with Dashboard — navigating between the
  // two reads from cache and revalidates in the background.
  const { videos, isInitialLoading, error: videosError } = useVideos();

  const { data: repoDocs = [] } = useQuery<RepoDocRow[]>({
    queryKey: ["documents", "repo", activeOrg?.id],
    queryFn: () => api<RepoDocRow[]>("/api/v1/documents/?source_type=repo"),
    enabled: !!activeOrg,
  });
  const loading = isInitialLoading;
  const error =
    videosError instanceof ApiError
      ? videosError.detail
      : videosError
      ? "Failed to load videos."
      : "";

  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  // Guests can be invited to view docs but cannot create new ones.
  const role = activeOrg?.role;
  const canUpload = role === "owner" || role === "admin" || role === "member";

  // Unified row shape so videos and repo docs render in the same table.
  type UnifiedRow =
    | {
        kind: "video";
        key: string;
        videoId: number;
        title: string;
        outputType: string;
        status: VideoStatus;
        createdAt: string;
        updatedAt: string | null;
        createdBy: string | null;
        createdByIsFormer: boolean;
      }
    | {
        kind: "repo";
        key: string;
        viewPath: string;
        title: string;
        outputType: string;
        sourceLabel: string;
        createdAt: string;
        updatedAt: string | null;
      };

  const unified: UnifiedRow[] = useMemo(() => {
    const vids: UnifiedRow[] = videos.map((v) => ({
      kind: "video",
      key: `v-${v.id}`,
      videoId: v.id,
      title: v.title,
      outputType: v.output_type || "sop",
      status: v.status,
      createdAt: v.created_at,
      updatedAt: v.updated_at ?? null,
      createdBy: v.created_by ?? null,
      createdByIsFormer: !!v.created_by_is_former,
    }));
    const docs: UnifiedRow[] = repoDocs.map((d) => ({
      kind: "repo",
      key: `d-${d.id}`,
      viewPath: d.view_path,
      title: d.title ?? "Untitled",
      outputType: d.output_type,
      sourceLabel: d.source_label,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
    return [...vids, ...docs].sort((a, b) => {
      const ta = new Date(a.updatedAt ?? a.createdAt).getTime();
      const tb = new Date(b.updatedAt ?? b.createdAt).getTime();
      return tb - ta;
    });
  }, [videos, repoDocs]);

  const filtered = useMemo(() => {
    let out = unified;
    // Status filters only make sense for video sources. Picking one hides
    // repo docs because they have no status concept.
    if (filter === "published") {
      out = out.filter((r) => r.kind === "video" && r.status === "completed");
    } else if (filter === "processing") {
      out = out.filter(
        (r) => r.kind === "video" && (r.status === "processing" || r.status === "pending")
      );
    } else if (filter === "failed") {
      out = out.filter((r) => r.kind === "video" && r.status === "failed");
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((r) => r.title.toLowerCase().includes(q));
    }
    return out;
  }, [unified, filter, search]);

  const filterCount = (k: FilterKey) => {
    if (k === "all") return unified.length;
    if (k === "published") return videos.filter((v) => v.status === "completed").length;
    if (k === "processing")
      return videos.filter((v) => v.status === "processing" || v.status === "pending").length;
    return videos.filter((v) => v.status === "failed").length;
  };

  return (
    <MainLayout breadcrumbs={[{ label: activeOrg?.name ?? "Workspace" }, { label: "All Documents" }]}>
      <div className="px-6 py-6 max-w-[1400px]">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent mb-2">
              Library · {activeOrg?.name ?? "Workspace"}
            </div>
            <h1 className="font-serif font-normal text-[42px] tracking-tight text-t1 leading-[1.02] mb-2">
              All documents
            </h1>
            <p className="font-serif italic text-[16px] text-t3 leading-relaxed">
              {unified.length} {unified.length === 1 ? "document" : "documents"} in {activeOrg?.name ?? "this workspace"}.
            </p>
          </div>
          {canUpload && (
            <NavLink to="/process">
              <Button variant="primary" size="md">+ Generate</Button>
            </NavLink>
          )}
        </div>

        <div className="bg-s1 border border-l1 rounded-md overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-l1 flex items-center gap-2 flex-wrap">
            <Filter size={12} className="text-t5 mr-1" />
            {(["all", "published", "processing", "failed"] as FilterKey[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  "font-mono text-[9px] font-medium uppercase tracking-wide px-2 py-1 rounded-xs border transition flex items-center gap-1.5",
                  filter === f
                    ? "bg-s3 border-l3 text-t2"
                    : "bg-transparent border-l1 text-t5 hover:border-l2 hover:text-t3",
                ].join(" ")}
              >
                {FILTER_LABEL[f]}
                <span className="text-t5">{filterCount(f)}</span>
              </button>
            ))}
            <div className="flex-1" />
            <div className="flex items-center gap-2 bg-s2 border border-l1 rounded-sm h-7 px-2.5 w-[200px]">
              <Search size={12} className="text-t5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a document"
                className="flex-1 bg-transparent text-[11px] text-t2 placeholder:text-t5 outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <Loader2 size={16} className="mx-auto text-t4 animate-spin mb-2" />
              <div className="text-[12px] text-t5">Loading…</div>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center font-mono text-[10px] text-err-fg">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-[13px] text-t2 font-medium mb-1">
                {unified.length === 0 ? "No documents yet" : "No documents match"}
              </div>
              <div className="text-[12px] text-t5 mb-4 max-w-sm mx-auto">
                {unified.length === 0
                  ? canUpload
                    ? "Generate your first document from a screen recording or a GitHub repository."
                    : "Documents shared with you will appear here. Ask an owner or admin to share one."
                  : "Try a different filter or search query."}
              </div>
              {unified.length === 0 && canUpload && (
                <div className="flex items-center justify-center gap-3">
                  <NavLink to="/process">
                    <Button variant="primary" size="sm">Generate document</Button>
                  </NavLink>
                  <NavLink
                    to="/documents/sample"
                    className="font-mono text-[10px] text-t5 hover:text-t3 underline underline-offset-2"
                  >
                    See the sample
                  </NavLink>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-s2">
                  {["Name", "Source", "Doc type", "Status", "Created", "Updated"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left font-mono text-[9px] uppercase tracking-wide text-t5 border-b border-l1"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) =>
                  r.kind === "video" ? (
                    <tr
                      key={r.key}
                      className="border-b border-l1 last:border-0 hover:bg-s2 cursor-pointer"
                      onMouseEnter={() => prefetchVideo(r.videoId)}
                      onClick={() => navigate(`/documents/${r.videoId}`)}
                    >
                      <td className="px-4 py-2.5 text-t2 font-medium">{r.title}</td>
                      <td className="px-4 py-2.5">
                        <Pill variant="neutral">Video</Pill>
                      </td>
                      <td className="px-4 py-2.5 text-t4">
                        {DOC_OUTPUT_LABEL[r.outputType as DocOutputType] ?? r.outputType}
                      </td>
                      <td className="px-4 py-2.5">{statusPill(r.status)}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-t5">
                        {fmtDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-t5">
                        {r.updatedAt ? fmtDate(r.updatedAt) : "—"}
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={r.key}
                      className="border-b border-l1 last:border-0 hover:bg-s2 cursor-pointer"
                      onClick={() => navigate(r.viewPath)}
                    >
                      <td className="px-4 py-2.5 text-t2 font-medium">{r.title}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <Pill variant="neutral">
                            <Github size={9} className="inline mr-1" />
                            GitHub
                          </Pill>
                          <span className="font-mono text-[10px] text-t5 truncate">
                            {r.sourceLabel}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-t4">
                        {DOC_OUTPUT_LABEL[r.outputType as DocOutputType] ?? r.outputType}
                      </td>
                      <td className="px-4 py-2.5">
                        <Pill variant="ok">Generated</Pill>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-t5">
                        {fmtDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-t5">
                        {r.updatedAt ? fmtDate(r.updatedAt) : "—"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AllDocuments;
