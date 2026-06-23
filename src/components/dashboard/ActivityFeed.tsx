import { CheckCircle2, FileText, Loader2, XCircle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { usePrefetchVideo } from "../../hooks/useVideos";
import type { BackendVideoSummary, VideoStatus } from "../../lib/video-types";

interface ActivityFeedProps {
  videos: BackendVideoSummary[];
  limit?: number;
}

const fmtRelative = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const statusIcon = (status: VideoStatus) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 size={13} className="text-ok-fg" />;
    case "processing":
    case "pending":
      return <Loader2 size={13} className="text-info-fg animate-spin" />;
    case "failed":
      return <XCircle size={13} className="text-err-fg" />;
  }
};

const statusVerb = (status: VideoStatus) => {
  switch (status) {
    case "completed":
      return "published";
    case "processing":
      return "is processing";
    case "pending":
      return "queued";
    case "failed":
      return "failed";
  }
};

const ActivityFeed = ({ videos, limit = 8 }: ActivityFeedProps) => {
  const prefetchVideo = usePrefetchVideo();
  // Sort by updated_at if available else created_at
  const sorted = [...videos]
    .sort((a, b) => {
      const at = new Date(a.updated_at ?? a.created_at).getTime();
      const bt = new Date(b.updated_at ?? b.created_at).getTime();
      return bt - at;
    })
    .slice(0, limit);

  if (sorted.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <FileText size={16} className="mx-auto text-t5 mb-2" />
        <div className="text-[12px] text-t5">No activity yet</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {sorted.map((v, i) => (
        <NavLink
          key={v.id}
          to={`/documents/${v.id}`}
          onMouseEnter={() => prefetchVideo(v.id)}
          className={[
            "flex items-start gap-3 px-4 py-2.5 hover:bg-s2 transition",
            i < sorted.length - 1 ? "border-b border-l1" : "",
          ].join(" ")}
        >
          <div className="mt-[2px] flex-shrink-0">{statusIcon(v.status)}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-t2 truncate">
              <span className="text-t1 font-medium">{v.title}</span>
              <span className="text-t5"> · {statusVerb(v.status)}</span>
            </div>
            <div className="font-mono text-[10px] text-t5 mt-0.5">
              {fmtRelative(v.updated_at ?? v.created_at)}
            </div>
          </div>
        </NavLink>
      ))}
    </div>
  );
};

export default ActivityFeed;
