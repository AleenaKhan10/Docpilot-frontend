import React from "react";
import clsx from "clsx";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode; // Lucide icon
  rightIcon?: React.ReactNode; // Lucide icon
  variant?: "default" | "outline" | "filled";
  inputSize?: "sm" | "md" | "lg"; // renamed from size
  className?: string;
}

const sizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-3 text-base",
  lg: "h-12 px-4 text-lg",
};

const variantClasses = {
  default:
    "border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
  outline:
    "border-2 border-gray-400 bg-white focus:border-blue-600 focus:ring-0",
  filled:
    "bg-gray-100 border border-gray-200 focus:border-blue-500 focus:bg-white",
};

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  variant = "default",
  inputSize = "md",
  className,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {leftIcon}
          </span>
        )}

        <input
          className={clsx(
            "rounded-md w-full outline-none transition-all duration-200 flex items-center",
            variantClasses[variant],
            sizeClasses[inputSize],
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer">
            {rightIcon}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
    </div>
  );
};

export default Input;
