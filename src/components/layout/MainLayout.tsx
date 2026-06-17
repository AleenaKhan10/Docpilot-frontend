import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface MainLayoutProps {
  breadcrumbs?: { label: string; to?: string }[];
  children: React.ReactNode;
}

const MainLayout = ({ breadcrumbs, children }: MainLayoutProps) => (
  <div className="flex h-screen overflow-hidden bg-bg">
    <Sidebar />
    <main className="flex-1 flex flex-col overflow-hidden min-w-0">
      <Topbar breadcrumbs={breadcrumbs} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </main>
  </div>
);

export default MainLayout;
