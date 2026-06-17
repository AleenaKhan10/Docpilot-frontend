import { FileText, Settings, Sparkles, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { Role } from "../../lib/types";

interface QuickActionsProps {
  role: Role | undefined;
}

const QuickActions = ({ role }: QuickActionsProps) => {
  const canUpload = role === "owner" || role === "editor";
  const isOwner = role === "owner";

  const actions = [
    {
      to: "/upload",
      icon: <Sparkles size={14} />,
      title: "New document",
      desc: "Upload a screen recording → structured doc.",
      featured: true,
      visible: canUpload,
    },
    {
      to: "/documents",
      icon: <FileText size={14} />,
      title: "All documents",
      desc: "Browse every doc in this organization.",
      visible: true,
    },
    {
      to: "/team",
      icon: <Users size={14} />,
      title: "Invite a teammate",
      desc: "Add an editor or viewer to your workspace.",
      visible: isOwner,
    },
    {
      to: "/settings",
      icon: <Settings size={14} />,
      title: "Organization settings",
      desc: "Branding, plan, integrations.",
      visible: isOwner,
    },
  ].filter((a) => a.visible);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {actions.map((a) => (
        <NavLink
          key={a.to}
          to={a.to}
          className={[
            "bg-s1 border rounded-md p-4 transition relative overflow-hidden block",
            a.featured
              ? "border-l3 hover:bg-s2 hover:border-white"
              : "border-l1 hover:bg-s2 hover:border-l3",
          ].join(" ")}
        >
          {a.featured && (
            <div className="absolute top-0 left-0 right-0 h-px bg-t2" />
          )}
          <div className="w-7 h-7 bg-s3 border border-l2 rounded-sm flex items-center justify-center mb-3 text-t2">
            {a.icon}
          </div>
          <div className="text-[12px] font-semibold text-t1 mb-1">{a.title}</div>
          <div className="text-[11px] text-t4 leading-[1.55]">{a.desc}</div>
        </NavLink>
      ))}
    </div>
  );
};

export default QuickActions;
