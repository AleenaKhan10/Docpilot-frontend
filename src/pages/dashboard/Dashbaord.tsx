import { ArrowUpRight } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import MainLayout from "../../components/layout/MainLayout";
import Pill from "../../components/ui/Pill";
import TableSkeleton from "../../components/ui/TableSkeleton";
import Sparkline from "../../components/charts/Sparkline";
import Donut from "../../components/charts/Donut";
import StatTile from "../../components/dashboard/StatTile";
import ActivityFeed from "../../components/dashboard/ActivityFeed";
import QuickActions from "../../components/dashboard/QuickActions";
import { useOrg } from "../../contexts/OrgContext";
import { ApiError } from "../../lib/api";
import { useVideos, usePrefetchVideo } from "../../hooks/useVideos";
import type { BackendVideoSummary, VideoStatus } from "../../lib/video-types";

// Minutes a human technical writer would have spent producing this doc,
// per published video. Conservative — most SOP-style docs take longer.
const ESTIMATED_MINUTES_SAVED_PER_DOC = 12;

const OUTPUT_TYPE_LABEL: Record<string, string> = {
  sop: "SOP",
  training: "Training",
  bug_report: "Bug report",
  changelog: "Changelog",
  audit: "Audit",
  client_handover: "Handover",
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

const fmtRelative = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

/** Build N days of zero-padded counts ending today (today is last element). */
const buildDailyCounts = (videos: BackendVideoSummary[], days: number) => {
  const buckets = new Array(days).fill(0);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (const v of videos) {
    // Normalise the video's created_at to the *start* of its day too;
    // otherwise a doc created 44m ago today gives a slightly-negative
    // diff (today midnight - today 12:16am = -44m) and Math.floor sends
    // it to -1, dropping today's docs from the chart.
    const c = new Date(v.created_at);
    const createdStartOfDay = new Date(
      c.getFullYear(),
      c.getMonth(),
      c.getDate()
    ).getTime();
    const daysAgo = Math.round((startOfToday - createdStartOfDay) / 86_400_000);
    if (daysAgo >= 0 && daysAgo < days) {
      buckets[days - 1 - daysAgo] += 1;
    }
  }
  return buckets;
};

const Dashboard = () => {
  const { activeOrg } = useOrg();
  const navigate = useNavigate();
  const prefetchVideo = usePrefetchVideo();
  const { videos, isInitialLoading, error: videosError } = useVideos();
  // Only show the skeleton on the very first fetch — re-navigations
  // from a cached list paint instantly while a background refetch runs.
  const loading = isInitialLoading;
  const error =
    videosError instanceof ApiError
      ? videosError.detail
      : videosError
      ? "Failed to load videos."
      : "";

  // Only successfully-generated docs count as "docs". Queued, processing
  // and failed videos still show in the recent list (so the user can see
  // what's in flight) but they don't inflate the headline numbers.
  const completedVideos = useMemo(
    () => videos.filter((v) => v.status === "completed"),
    [videos]
  );

  // ───── Derived stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const completed = completedVideos.length;
    const processing = videos.filter(
      (v) => v.status === "processing" || v.status === "pending"
    ).length;
    const failed = videos.filter((v) => v.status === "failed").length;

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86_400_000;
    const fourteenDaysAgo = now - 14 * 86_400_000;

    const lastWeek = completedVideos.filter(
      (v) => new Date(v.created_at).getTime() >= sevenDaysAgo
    ).length;
    const weekBefore = completedVideos.filter((v) => {
      const t = new Date(v.created_at).getTime();
      return t >= fourteenDaysAgo && t < sevenDaysAgo;
    }).length;
    const weekDelta = lastWeek - weekBefore;

    const minutesSaved = completed * ESTIMATED_MINUTES_SAVED_PER_DOC;
    const hoursSaved = (minutesSaved / 60).toFixed(1);

    return {
      total: completed,
      completed,
      processing,
      failed,
      lastWeek,
      weekDelta,
      hoursSaved,
    };
  }, [videos, completedVideos]);

  // ───── Daily activity for sparkline ────────────────────────────────
  const dailyCounts = useMemo(
    () => buildDailyCounts(completedVideos, 14),
    [completedVideos]
  );

  // ───── Output-type distribution ────────────────────────────────────
  const outputBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of completedVideos) {
      const t = v.output_type || "sop";
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([k, value]) => ({
        label: OUTPUT_TYPE_LABEL[k] ?? k,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [completedVideos]);

  const recent = videos.slice(0, 5);

  return (
    <MainLayout breadcrumbs={[{ label: activeOrg?.name ?? "Workspace" }, { label: "Dashboard" }]}>
      <div className="px-6 py-6 max-w-[1400px]">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <StatTile
            value={stats.total}
            label="Documents"
            footnote={stats.total === 0 ? "no activity yet" : "all-time"}
            loading={loading}
          />
          <StatTile
            value={stats.lastWeek}
            label="Created last 7 days"
            trendValue={stats.weekDelta}
            trendLabel="vs prior 7 days"
            loading={loading}
          />
          <StatTile
            value={stats.processing}
            label="In progress"
            footnote={stats.processing === 0 ? "queue empty" : "active jobs"}
            loading={loading}
          />
          <StatTile
            value={`${stats.hoursSaved}h`}
            label="Time saved (est.)"
            footnote={`${ESTIMATED_MINUTES_SAVED_PER_DOC} min/doc baseline`}
            loading={loading}
          />
        </div>

        {/* Quick actions */}
        <div className="mb-6">
          <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-t5 mb-2.5">
            Quick actions
          </div>
          <QuickActions role={activeOrg?.role} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-6">
          <div className="lg:col-span-2 bg-s1 border border-l1 rounded-md p-4">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-t5">
                  Activity · last 14 days
                </div>
                {loading ? (
                  <div className="h-6 w-32 rounded-sm bg-s3/60 animate-pulse mt-1.5" />
                ) : (
                  <div className="font-mono text-[24px] font-medium text-white tracking-[-0.04em] leading-none mt-1.5">
                    {dailyCounts.reduce((a, b) => a + b, 0)}
                    <span className="text-t5 text-[12px] ml-2">
                      docs created
                    </span>
                  </div>
                )}
              </div>
              <NavLink
                to="/documents"
                className="text-[11px] text-t4 hover:text-t2 flex items-center gap-1"
              >
                Open all <ArrowUpRight size={11} />
              </NavLink>
            </div>
            {loading ? (
              <div className="h-[140px] rounded-sm bg-s3/30 animate-pulse" />
            ) : (
              <Sparkline
                data={dailyCounts}
                height={140}
                showLast
                showTicks
                tickLabels={["14d ago", "Today"]}
              />
            )}
          </div>

          <div className="bg-s1 border border-l1 rounded-md p-4">
            <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-t5 mb-3">
              By output type
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-[140px]">
                <div className="w-[140px] h-[140px] rounded-full bg-s3/30 animate-pulse" />
              </div>
            ) : (
              <Donut
                data={outputBreakdown}
                centerValue={stats.total}
                centerLabel="Docs"
                size={140}
              />
            )}
          </div>
        </div>

        {/* Recent + activity feed row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <div className="lg:col-span-2 bg-s1 border border-l1 rounded-md overflow-hidden">
            <div className="px-4 py-2.5 border-b border-l1 flex items-center justify-between">
              <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-t5">
                Recent documents
              </div>
              <NavLink to="/documents" className="text-[11px] text-t4 hover:text-t2 flex items-center gap-1">
                View all <ArrowUpRight size={11} />
              </NavLink>
            </div>
            {loading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : error ? (
              <div className="px-6 py-8 text-center font-mono text-[10px] text-err-fg">
                {error}
              </div>
            ) : recent.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-[13px] text-t2 font-medium mb-1">
                  No documents yet
                </div>
                <div className="text-[12px] text-t5 mb-4 max-w-sm mx-auto">
                  Upload a screen recording to generate your first structured document.{" "}
                  <NavLink
                    to="/documents/sample"
                    className="text-t2 underline underline-offset-2 hover:text-white"
                  >
                    View the sample SOP
                  </NavLink>
                  .
                </div>
              </div>
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-s2">
                    {["Name", "Type", "Status", "Created", "Created by", "Updated"].map((h) => (
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
                  {recent.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-l1 last:border-0 hover:bg-s2 cursor-pointer"
                      onMouseEnter={() => prefetchVideo(v.id)}
                      onClick={() => navigate(`/documents/${v.id}`)}
                    >
                      <td className="px-4 py-2.5 text-t2 font-medium">{v.title}</td>
                      <td className="px-4 py-2.5 text-t4">
                        {OUTPUT_TYPE_LABEL[v.output_type || "sop"] ?? v.output_type}
                      </td>
                      <td className="px-4 py-2.5">{statusPill(v.status)}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-t5">
                        {fmtRelative(v.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-t3">
                        {v.created_by ? (
                          <>
                            {v.created_by}
                            {v.created_by_is_former && (
                              <span className="ml-1.5 font-mono text-[9px] uppercase tracking-wide text-t5">
                                former
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-t5">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-t5">
                        {v.updated_at ? fmtRelative(v.updated_at) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-s1 border border-l1 rounded-md overflow-hidden">
            <div className="px-4 py-2.5 border-b border-l1 font-mono text-[9px] tracking-[0.1em] uppercase text-t5">
              Activity
            </div>
            <ActivityFeed videos={videos} limit={8} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
