import React from "react";

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-mono text-[9px] text-l4 bg-s2 border border-l2 rounded-xs px-1.5 py-[1px]">
    {children}
  </span>
);

export default Kbd;
