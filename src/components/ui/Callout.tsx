import { AlertTriangle, Info, Lightbulb, ShieldAlert } from "lucide-react";
import React from "react";
import clsx from "clsx";

export type CalloutKind = "note" | "tip" | "warning" | "danger";

interface CalloutProps {
  kind: CalloutKind;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

const styles: Record<
  CalloutKind,
  { box: string; icon: React.ReactNode; label: string }
> = {
  note: {
    box: "bg-info-bg/40 border-info-line",
    icon: <Info size={13} className="text-info-fg" />,
    label: "Note",
  },
  tip: {
    box: "bg-ok-bg/40 border-ok-line",
    icon: <Lightbulb size={13} className="text-ok-fg" />,
    label: "Tip",
  },
  warning: {
    box: "bg-warn-bg/40 border-warn-line",
    icon: <AlertTriangle size={13} className="text-warn-fg" />,
    label: "Warning",
  },
  danger: {
    box: "bg-err-bg/40 border-err-line",
    icon: <ShieldAlert size={13} className="text-err-fg" />,
    label: "Caution",
  },
};

const Callout: React.FC<CalloutProps> = ({ kind, title, children, className }) => {
  const s = styles[kind];
  return (
    <div
      className={clsx(
        "rounded-md border px-3.5 py-3 flex gap-3 items-start",
        s.box,
        className
      )}
    >
      <div className="flex-shrink-0 mt-[2px]">{s.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-t3 mb-1">
          {title ?? s.label}
        </div>
        <div className="text-[12px] text-t3 leading-[1.65]">{children}</div>
      </div>
    </div>
  );
};

export default Callout;
