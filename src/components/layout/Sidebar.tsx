import { NavLink } from "react-router-dom";
import {
  ChevronsUpDown,
  FileText,
  LayoutGrid,
  Sparkles,
  Users,
  Settings,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrg } from "../../contexts/OrgContext";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";
import { queryKeys } from "../../lib/query-client";
import type { Member, Invitation } from "../../lib/types";
import type { BackendVideoSummary } from "../../lib/video-types";
import Logo from "./Logo";

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-2 px-2 py-1.5 rounded-sm text-[12px] leading-tight",
    "transition-colors mb-[1px]",
    isActive
      ? "bg-s2 text-white font-medium"
      : "text-t4 hover:bg-s1 hover:text-t2",
  ].join(" ");

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="font-mono text-[9px] font-medium tracking-[0.1em] uppercase text-l4 px-2 pt-2.5 pb-1">
    {children}
  </div>
);

const getInitials = (full?: string | null, email?: string | null) => {
  if (full && full.trim()) {
    const parts = full.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
};

const Sidebar = () => {
  const { orgs, activeOrg, switchOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Hover-driven prefetch. When the user mouses over a nav item we kick
  // off the fetch for that page's primary data, so by the time React
  // mounts the destination page (~100-200 ms later) the cache is already
  // warm. queryClient.prefetchQuery is a no-op if the data is fresh, so
  // these handlers are safe to wire onto every nav item.
  const orgId = activeOrg?.id;
  const prefetchVideos = () => {
    if (!orgId) return;
    queryClient.prefetchQuery({
      queryKey: queryKeys.videos(orgId),
      queryFn: () => api<BackendVideoSummary[]>("/api/v1/videos/"),
    });
  };
  const prefetchTeam = () => {
    if (!orgId) return;
    queryClient.prefetchQuery({
      queryKey: queryKeys.members(orgId),
      queryFn: () => api<Member[]>("/api/v1/orgs/members"),
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.invitations(orgId),
      queryFn: () => api<Invitation[]>("/api/v1/invitations/"),
    });
  };

  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOrgMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const role = activeOrg?.role;
  // Admin section visible to org-level Owner + Admin (mirrors backend).
  const isAdminOrAbove = role === "owner" || role === "admin";
  // Upload allowed for everyone except Guest.
  const canUpload = role === "owner" || role === "admin" || role === "member";

  const fullName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ??
    null;
  const initials = getInitials(fullName, user?.email);

  const orgInitials = activeOrg?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <aside className="w-[220px] flex-shrink-0 bg-bg2 border-r border-l1 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="h-[52px] px-3.5 border-b border-l1 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-6 h-6 bg-white text-bg rounded-sm flex items-center justify-center">
          <Logo size={14} />
        </div>
        <span className="font-semibold text-[13px] tracking-tight text-white">
          DocPilot
        </span>
      </div>

      {/* Org switcher */}
      <div className="relative mx-2 mt-2 mb-1" ref={menuRef}>
        <button
          onClick={() => setOrgMenuOpen((o) => !o)}
          disabled={orgs.length === 0}
          className="w-full px-2.5 py-1.5 bg-s1 border border-l1 rounded-sm flex items-center gap-2 hover:bg-s2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="w-[18px] h-[18px] bg-s3 border border-l2 rounded-[3px] flex items-center justify-center font-mono text-[9px] font-medium text-t3">
            {orgInitials}
          </div>
          <span className="text-[11px] font-medium text-t2 flex-1 text-left truncate">
            {activeOrg?.name ?? "No organization"}
          </span>
          <ChevronsUpDown size={10} className="text-t5" />
        </button>

        {orgMenuOpen && orgs.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-s1 border border-l2 rounded-md shadow-xl z-30 max-h-80 overflow-y-auto">
            {orgs.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  switchOrg(o.id);
                  setOrgMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-s2 cursor-pointer text-left"
              >
                <div className="w-[18px] h-[18px] bg-s3 border border-l2 rounded-[3px] flex items-center justify-center font-mono text-[9px] font-medium text-t3 flex-shrink-0">
                  {o.name[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-t2 truncate">{o.name}</div>
                  <div className="font-mono text-[9px] text-t5 uppercase">
                    {o.role}
                  </div>
                </div>
                {o.id === activeOrg?.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                )}
              </button>
            ))}
            <NavLink
              to="/create-org"
              onClick={() => setOrgMenuOpen(false)}
              className="block px-2.5 py-1.5 text-[11px] text-t3 hover:bg-s2 border-t border-l1"
            >
              + New organization
            </NavLink>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        <div>
          <SectionLabel>Workspace</SectionLabel>
          <NavLink to="/" className={linkClasses} end onMouseEnter={prefetchVideos}>
            <LayoutGrid size={13} /> Dashboard
          </NavLink>
          <NavLink to="/documents" className={linkClasses} onMouseEnter={prefetchVideos}>
            <FileText size={13} /> All Documents
          </NavLink>
          {canUpload && (
            <NavLink to="/upload" className={linkClasses}>
              <Sparkles size={13} /> Generate
            </NavLink>
          )}
        </div>

        {isAdminOrAbove && (
          <div>
            <SectionLabel>Administration</SectionLabel>
            <NavLink to="/team" className={linkClasses} onMouseEnter={prefetchTeam}>
              <Users size={13} /> Team
            </NavLink>
            <NavLink to="/settings" className={linkClasses}>
              <Settings size={13} /> Settings
            </NavLink>
          </div>
        )}
      </div>

      {/* User */}
      <div className="border-t border-l1 px-1.5 py-2 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-sm hover:bg-s1 cursor-pointer">
          <div className="w-[26px] h-[26px] rounded-full bg-s3 border border-l2 flex items-center justify-center font-mono text-[9px] font-medium text-t3 flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium text-t2 truncate">
              {fullName || user?.email}
            </div>
            <div className="font-mono text-[9px] text-t5 uppercase">
              {activeOrg?.role ?? "—"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
