import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variants = {
  primary: "bg-white text-ink hover:opacity-90",
  ghost: "bg-transparent border border-l2 text-t3 hover:bg-s1 hover:border-l3 hover:text-t2",
  subtle: "bg-s2 text-t2 hover:bg-s3",
  danger: "bg-transparent border border-[#3B1212] text-err-fg hover:bg-[#180808]",
};

const sizes = {
  sm: "h-[26px] px-2.5 text-[11px]",
  md: "h-8 px-3.5 text-[12px]",
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
        "inline-flex items-center justify-center gap-1.5 rounded-sm font-medium tracking-tight transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap",
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
