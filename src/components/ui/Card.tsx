import React from "react";
import clsx from "clsx";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: "sm" | "md" | "lg";
}

const paddings = {
  sm: "p-3.5",
  md: "p-[18px]",
  lg: "p-6",
};

const Card: React.FC<CardProps> = ({ className, padding = "md", children }) => (
  <div
    className={clsx(
      "bg-s1 border border-l1 rounded-md",
      paddings[padding],
      className
    )}
  >
    {children}
  </div>
);

export const CardLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={clsx(
      "font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-t5 mb-3",
      className
    )}
  >
    {children}
  </div>
);

export default Card;
