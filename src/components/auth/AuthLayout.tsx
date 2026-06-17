import React from "react";
import Logo from "../layout/Logo";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  preview?: React.ReactNode;
}

const AuthLayout = ({
  title,
  subtitle,
  children,
  footer,
  preview,
}: AuthLayoutProps) => (
  <div className="flex h-screen bg-bg">
    {/* Left panel */}
    <div className="w-[440px] flex-shrink-0 bg-bg2 border-r border-l1 flex flex-col px-10 py-12 overflow-y-auto">
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-8 h-8 bg-white text-bg rounded-md flex items-center justify-center">
          <Logo size={16} />
        </div>
        <span className="text-[16px] font-semibold tracking-tight text-white">
          DocPilot
        </span>
      </div>

      <h1 className="text-[24px] font-semibold tracking-tight text-white mb-2">
        {title}
      </h1>
      {subtitle && (
        <p className="text-[13px] text-t4 mb-9 leading-relaxed">{subtitle}</p>
      )}

      <div className="flex-1">{children}</div>

      {footer && (
        <div className="mt-auto pt-8 text-[11px] text-t5 leading-relaxed">
          {footer}
        </div>
      )}
    </div>

    {/* Right panel — preview */}
    <div className="hidden md:flex flex-1 items-center justify-center bg-bg relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-l1) 1px,transparent 1px),linear-gradient(90deg,var(--color-l1) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 w-[380px]">
        {preview ?? <DefaultPreview />}
      </div>
    </div>
  </div>
);

const DefaultPreview = () => (
  <div className="bg-s1 border border-l2 rounded-lg p-6">
    <div className="flex items-center gap-2 mb-5 pb-3.5 border-b border-l1">
      <div className="w-1.5 h-1.5 rounded-full bg-err-fg" />
      <div className="w-1.5 h-1.5 rounded-full bg-warn-fg" />
      <div className="w-1.5 h-1.5 rounded-full bg-ok-fg" />
      <div className="font-mono text-[11px] text-t3 ml-auto">
        onboarding-flow.pdf
      </div>
    </div>

    {[
      { n: "01", lines: ["w100", "w80"] },
      { n: "02", lines: ["w100", "w60"], img: true },
      { n: "03", lines: ["w80", "w60"] },
      { n: "04", lines: ["w100", "w60"], img: true },
    ].map((s, i) => (
      <div
        key={i}
        className="flex gap-2.5 items-start py-2 border-b border-l1 last:border-0"
      >
        <div className="font-mono text-[9px] text-t5 w-4 flex-shrink-0 pt-0.5 text-right">
          {s.n}
        </div>
        <div className="flex-1 flex flex-col gap-1">
          {s.lines.map((w, j) => (
            <div
              key={j}
              className="h-1.5 rounded-[2px] bg-l2"
              style={{ width: w === "w100" ? "100%" : w === "w80" ? "80%" : "60%" }}
            />
          ))}
          {s.img && (
            <div className="h-10 bg-s3 border border-l2 rounded-sm mt-1 flex items-center justify-center">
              <span className="font-mono text-[8px] text-l4 border border-dashed border-l2 px-2 py-1 rounded-sm">
                screenshot
              </span>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

export default AuthLayout;
