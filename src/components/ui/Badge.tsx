import React from "react";
import clsx from "clsx";

type BadgeVariant = "Pending" | "Completed" | "Processing" | "Default";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  Completed: "bg-green-100 text-green-700 border border-green-200",
  Processing: "bg-blue-100 text-blue-700 border border-blue-200",
  Pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Default: "bg-gray-100 text-gray-700 border border-gray-200",
};

const sizeClasses = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-3 py-1.5",
};

const Badge: React.FC<BadgeProps> = ({ label, variant = "Default", size = "sm", className }) => {
  return (
    <span className={clsx("rounded-md inline-flex items-center", variantClasses[variant], sizeClasses[size], className)}>
      {label}
    </span>
  );
};

export default Badge;
