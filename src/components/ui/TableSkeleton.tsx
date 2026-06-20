/**
 * Minimal placeholder for table-shaped content. Renders N rows of M cells,
 * each a low-opacity rounded bar. Reads as "something is coming" without
 * being a noisy spinner — the dimensions roughly match a real row so the
 * page doesn't jump when data lands.
 */
const TableSkeleton = ({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) => (
  <div className="px-4 py-3" aria-hidden>
    {Array.from({ length: rows }).map((_, r) => (
      <div
        key={r}
        className="flex items-center gap-3 py-2.5 border-b border-l1 last:border-0"
      >
        {Array.from({ length: cols }).map((_, c) => (
          <div
            key={c}
            className="h-3 rounded-sm bg-s3/60 animate-pulse"
            style={{
              flex: c === 0 ? "0 0 26%" : "1 1 0",
              opacity: 1 - r * 0.08,
            }}
          />
        ))}
      </div>
    ))}
  </div>
);

export default TableSkeleton;
