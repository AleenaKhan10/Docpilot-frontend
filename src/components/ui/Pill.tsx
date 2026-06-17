import React from "react";
import clsx from "clsx";

export type PillVariant =
  | "neutral"
  | "ok"
  | "warn"
  | "err"
  | "info"
  | "purple"
  | "yellow";

interface PillProps {
  variant?: PillVariant;
  className?: string;
  children: React.ReactNode;
}

const variants: Record<PillVariant, string> = {
  neutral: "bg-s3 text-t4 border-l2",
  ok: "bg-ok-bg text-ok-fg border-ok-line",
  warn: "bg-warn-bg text-warn-fg border-warn-line",
  err: "bg-err-bg text-err-fg border-err-line",
  info: "bg-info-bg text-info-fg border-info-line",
  purple: "bg-purple-bg text-purple-fg border-purple-line",
  yellow: "bg-yellow-bg text-yellow-fg border-yellow-line",
};

const Pill: React.FC<PillProps> = ({ variant = "neutral", className, children }) => (
  <span
    className={clsx(
      "inline-block font-mono text-[9px] font-medium uppercase tracking-wide px-1.5 py-[2px] rounded-xs border",
      variants[variant],
      className
    )}
  >
    {children}
  </span>
);

export default Pill;
