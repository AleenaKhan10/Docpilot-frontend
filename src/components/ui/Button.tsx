import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variants = {
  primary:
    "bg-white text-ink hover:bg-t1 shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]",
  ghost:
    "bg-transparent border border-l2 text-t3 hover:bg-s1 hover:border-l3 hover:text-t2",
  subtle: "bg-s2 border border-l1 text-t2 hover:bg-s3 hover:border-l2",
  danger:
    "bg-transparent border border-[#3B1212] text-err-fg hover:bg-[#180808]",
};

const sizes = {
  sm: "h-8 px-3 text-[11px]",
  md: "h-9 px-3.5 text-[12px]",
};

const Button: React.FC<ButtonProps> = ({
  variant = "ghost",
  size = "md",
  icon,
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-sm font-medium tracking-tight transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-l4 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};

export default Button;
