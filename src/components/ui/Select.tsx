import React from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  selectSize?: "sm" | "md";
}

const sizes = {
  sm: "h-8 pl-2.5 pr-7 text-[12px]",
  md: "h-9 pl-3 pr-8 text-[13px]",
};

const Select: React.FC<SelectProps> = ({
  label,
  hint,
  error,
  selectSize = "md",
  className,
  children,
  ...props
}) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && (
      <label className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-t5">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        className={clsx(
          "w-full appearance-none rounded-sm bg-s2 border border-l1 text-t1 outline-none transition cursor-pointer",
          "focus:border-l3",
          error && "border-err-fg/40",
          sizes[selectSize],
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-t5 pointer-events-none"
      />
    </div>
    {error ? (
      <p className="font-mono text-[10px] text-err-fg">{error}</p>
    ) : hint ? (
      <p className="font-mono text-[10px] text-t5">{hint}</p>
    ) : null}
  </div>
);

export default Select;
