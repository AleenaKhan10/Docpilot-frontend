import React from "react";
import clsx from "clsx";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md";
}

const sizes = {
  sm: "w-7 h-7",
  md: "w-8 h-8",
};

const IconButton: React.FC<IconButtonProps> = ({
  size = "md",
  className,
  children,
  ...props
}) => (
  <button
    className={clsx(
      "inline-flex items-center justify-center rounded-sm border border-l2 bg-transparent text-t4 transition hover:bg-s1 hover:border-l3 hover:text-t2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
      sizes[size],
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export default IconButton;
