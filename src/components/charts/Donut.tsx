interface DonutSlice {
  label: string;
  value: number;
  /** Foreground colour (text + slice). Defaults rotate through theme. */
  color?: string;
}

interface DonutProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  /** Big number in the centre. Defaults to total. */
  centerValue?: string | number;
  centerLabel?: string;
}

const DEFAULT_COLORS = [
  "var(--color-t1)",
  "var(--color-info-fg)",
  "var(--color-ok-fg)",
  "var(--color-warn-fg)",
  "var(--color-purple-fg)",
  "var(--color-err-fg)",
  "var(--color-yellow-fg)",
];

const Donut = ({
  data,
  size = 168,
  thickness = 18,
  centerValue,
  centerLabel,
}: DonutProps) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: size }}>
        <span className="text-[11px] text-t5 font-mono">No data</span>
      </div>
    );
  }

  const radius = size / 2 - thickness / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const slices = data.map((d, i) => {
    const fraction = d.value / total;
    const arc = fraction * circumference;
    const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
    const slice = (
      <circle
        key={d.label}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeDasharray={`${arc} ${circumference}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    );
    offset += arc;
    return slice;
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="block">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-l1)"
            strokeWidth={thickness}
          />
          {slices}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-[24px] font-medium text-white tracking-[-0.04em] leading-none">
            {centerValue ?? total}
          </div>
          {centerLabel && (
            <div className="font-mono text-[9px] uppercase tracking-wide text-t5 mt-1">
              {centerLabel}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {data.map((d, i) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          return (
            <div key={d.label} className="flex items-center gap-2.5">
              <span
                className="w-2 h-2 rounded-xs flex-shrink-0"
                style={{ background: color }}
              />
              <span className="text-[12px] text-t2 flex-1 truncate">{d.label}</span>
              <span className="font-mono text-[11px] text-t4">{d.value}</span>
              <span className="font-mono text-[10px] text-t5 w-9 text-right">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Donut;
