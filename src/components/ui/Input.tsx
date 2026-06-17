import React from "react";
import clsx from "clsx";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: "sm" | "md";
}

const sizes = {
  sm: "h-8 px-2.5 text-[12px]",
  md: "h-[38px] px-3 text-[13px]",
};

const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  inputSize = "md",
  className,
  ...props
}) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && (
      <label className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-t5">
        {label}
      </label>
    )}
    <div className="relative">
      {leftIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-t5">
          {leftIcon}
        </span>
      )}
      <input
        className={clsx(
          "w-full rounded-sm bg-s2 border border-l1 text-t1 outline-none transition placeholder:text-t5",
          "focus:border-l3 focus:bg-s2",
          error && "border-err-fg/40",
          sizes[inputSize],
          leftIcon && "pl-9",
          rightIcon && "pr-9",
          className
        )}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-t5">
          {rightIcon}
        </span>
      )}
    </div>
    {error ? (
      <p className="font-mono text-[10px] text-err-fg">{error}</p>
    ) : hint ? (
      <p className="font-mono text-[10px] text-t5">{hint}</p>
    ) : null}
  </div>
);

export default Input;
