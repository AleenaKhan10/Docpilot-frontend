import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface StatTileProps {
  value: string | number;
  label: string;
  /** Optional sub-label, e.g. comparison context */
  trendValue?: number;
  trendLabel?: string;
  /** Optional small monospace footnote */
  footnote?: string;
  loading?: boolean;
}

const StatTile = ({
  value,
  label,
  trendValue,
  trendLabel,
  footnote,
  loading,
}: StatTileProps) => {
  const hasTrend = trendValue !== undefined && trendValue !== null;
  const trendIcon =
    !hasTrend ? null : trendValue! > 0 ? (
      <ArrowUpRight size={11} className="text-ok-fg" />
    ) : trendValue! < 0 ? (
      <ArrowDownRight size={11} className="text-err-fg" />
    ) : (
      <Minus size={11} className="text-t5" />
    );

  const trendColor =
    !hasTrend
      ? "text-t5"
      : trendValue! > 0
      ? "text-ok-fg"
      : trendValue! < 0
      ? "text-err-fg"
      : "text-t5";

  if (loading) {
    return (
      <div
        className="bg-s1 border border-l1 rounded-md p-4 flex flex-col"
        aria-hidden
      >
        <div className="h-7 w-20 rounded-sm bg-s3/60 animate-pulse" />
        <div className="h-3 w-24 rounded-sm bg-s3/40 mt-2 animate-pulse" />
        <div className="h-3 w-16 rounded-sm bg-s3/30 mt-3 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-s1 border border-l1 rounded-md p-4 flex flex-col">
      <div className="font-mono text-[28px] font-medium text-white tracking-[-0.06em] leading-none">
        {value}
      </div>
      <div className="text-[11px] text-t5 mt-1.5">{label}</div>
      <div className="flex items-center gap-1.5 mt-3">
        {hasTrend ? (
          <>
            {trendIcon}
            <span className={`font-mono text-[10px] ${trendColor}`}>
              {trendValue! > 0 ? "+" : ""}
              {trendValue}
              {trendLabel ? ` · ${trendLabel}` : ""}
            </span>
          </>
        ) : (
          <span className="font-mono text-[9px] text-t5 bg-s2 border border-l1 rounded-xs px-1.5 py-[2px]">
            {footnote ?? "—"}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatTile;
