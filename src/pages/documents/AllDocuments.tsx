import { useEffect, useMemo, useState } from "react";
import { Filter, Loader2, Search } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import Pill from "../../components/ui/Pill";
import Button from "../../components/ui/Button";
import { useOrg } from "../../contexts/OrgContext";
import { api, ApiError } from "../../lib/api";
import type { BackendVideoSummary, VideoStatus } from "../../lib/video-types";

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
  const [videos, setVideos] = useState<BackendVideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  // Guests can be invited to view docs but cannot create new ones.
  const role = activeOrg?.role;
  const canUpload = role === "owner" || role === "admin" || role === "member";

  useEffect(() => {
    if (!activeOrg) return;
    setLoading(true);
    setError("");
    api<BackendVideoSummary[]>("/api/v1/videos/")
      .then(setVideos)
      .catch((err) =>
        setError(err instanceof ApiError ? err.detail : "Failed to load videos.")
      )
      .finally(() => setLoading(false));
  }, [activeOrg?.id]);

  const filtered = useMemo(() => {
    let out = videos;
    if (filter === "published") out = out.filter((v) => v.status === "completed");
    else if (filter === "processing")
      out = out.filter((v) => v.status === "processing" || v.status === "pending");
    else if (filter === "failed") out = out.filter((v) => v.status === "failed");

    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((v) => v.title.toLowerCase().includes(q));
    }
    return out;
  }, [videos, filter, search]);

  const filterCount = (k: FilterKey) => {
    if (k === "all") return videos.length;
    if (k === "published") return videos.filter((v) => v.status === "completed").length;
    if (k === "processing")
      return videos.filter((v) => v.status === "processing" || v.status === "pending").length;
    return videos.filter((v) => v.status === "failed").length;
  };

  return (
    <MainLayout breadcrumbs={[{ label: activeOrg?.name ?? "Workspace" }, { label: "All Documents" }]}>
      <div className="px-6 py-6 max-w-[1400px]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-white">All Documents</h1>
            <p className="text-[12px] text-t4 mt-0.5">
              {videos.length} {videos.length === 1 ? "document" : "documents"} in {activeOrg?.name ?? "this workspace"}.
            </p>
          </div>
          {canUpload && (
            <NavLink to="/upload">
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
                {videos.length === 0 ? "No documents yet" : "No documents match"}
              </div>
              <div className="text-[12px] text-t5 mb-4 max-w-sm mx-auto">
                {videos.length === 0
                  ? canUpload
                    ? "Generate your first document from a screen recording."
                    : "Documents shared with you will appear here. Ask an owner or admin to share one."
                  : "Try a different filter or search query."}
              </div>
              {videos.length === 0 && canUpload && (
                <div className="flex items-center justify-center gap-3">
                  <NavLink to="/upload">
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
                  {["Name", "Status", "Created", "Created by", "Updated"].map((h) => (
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
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-l1 last:border-0 hover:bg-s2 cursor-pointer"
                    onClick={() => navigate(`/documents/${v.id}`)}
                  >
                    <td className="px-4 py-2.5 text-t2 font-medium">{v.title}</td>
                    <td className="px-4 py-2.5">{statusPill(v.status)}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-t5">
                      {fmtDate(v.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-t3">
                      {v.created_by ?? <span className="text-t5">—</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-t5">
                      {v.updated_at ? fmtDate(v.updated_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AllDocuments;
