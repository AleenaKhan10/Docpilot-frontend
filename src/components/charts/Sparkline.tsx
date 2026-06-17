interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Show area fill below the line */
  fill?: boolean;
  /** Stroke colour CSS var/value */
  stroke?: string;
  /** Show a small label of the latest value */
  showLast?: boolean;
  /** Show axis ticks at start/end */
  showTicks?: boolean;
  tickLabels?: [string, string];
}

const Sparkline = ({
  data,
  width = 560,
  height = 120,
  fill = true,
  stroke = "var(--color-t2)",
  showLast = false,
  showTicks = false,
  tickLabels,
}: SparklineProps) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-[11px] text-t5 font-mono"
      >
        No activity yet
      </div>
    );
  }

  const pad = { left: 8, right: 24, top: 12, bottom: 24 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(1, ...data);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((v, i) => {
    const x = pad.left + i * stepX;
    const y = pad.top + innerH - (v / max) * innerH;
    return { x, y, v };
  });

  const path = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(" ");

  const areaPath = `${path} L${pad.left + (data.length - 1) * stepX},${
    pad.top + innerH
  } L${pad.left},${pad.top + innerH} Z`;

  // Horizontal baseline + 25/50/75% gridlines
  const gridlines = [0.25, 0.5, 0.75, 1].map((p) => pad.top + innerH * p);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto block"
      role="img"
      aria-label="Activity sparkline"
    >
      {gridlines.map((y, i) => (
        <line
          key={i}
          x1={pad.left}
          x2={width - pad.right}
          y1={y}
          y2={y}
          stroke="var(--color-l1)"
          strokeDasharray={i === gridlines.length - 1 ? "0" : "2,3"}
          strokeWidth={1}
        />
      ))}

      {fill && (
        <path
          d={areaPath}
          fill={stroke}
          opacity={0.08}
        />
      )}
      <path
        d={path}
        stroke={stroke}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 3 : 1.5}
          fill={i === points.length - 1 ? "var(--color-white)" : stroke}
        />
      ))}

      {showLast && (
        <text
          x={width - pad.right + 6}
          y={points[points.length - 1].y + 4}
          fontSize="10"
          fill="var(--color-t2)"
          fontFamily="var(--font-mono)"
        >
          {data[data.length - 1]}
        </text>
      )}

      {showTicks && tickLabels && (
        <>
          <text
            x={pad.left}
            y={height - 6}
            fontSize="9"
            fill="var(--color-t5)"
            fontFamily="var(--font-mono)"
          >
            {tickLabels[0]}
          </text>
          <text
            x={width - pad.right}
            y={height - 6}
            fontSize="9"
            fill="var(--color-t5)"
            fontFamily="var(--font-mono)"
            textAnchor="end"
          >
            {tickLabels[1]}
          </text>
        </>
      )}
    </svg>
  );
};

export default Sparkline;
