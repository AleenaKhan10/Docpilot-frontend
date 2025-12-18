import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  btnText?: string;
  variant?: "fill" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children?: React.ReactNode;
}

const buttonVariants = {
  fill: "bg-blue-600 text-white hover:bg-blue-700",
  outline: "border border-blue-600 text-blue-600 hover:bg-blue-50",
  ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-2.5 text-lg",
  xl: "px-6 py-3 text-xl",
};

const Button: React.FC<ButtonProps> = ({
  btnText,
  variant = "fill",
  size = "md",
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={clsx(
        "rounded-md font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {children}
      {btnText}
    </button>
  );
};

export default Button;
