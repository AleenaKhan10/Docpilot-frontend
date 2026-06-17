import { Bell, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconButton from "../ui/IconButton";
import Kbd from "../ui/Kbd";
import { useAuth } from "../../contexts/AuthContext";

interface TopbarProps {
  breadcrumbs?: { label: string; to?: string }[];
}

const Topbar = ({ breadcrumbs = [] }: TopbarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="h-[52px] flex-shrink-0 bg-bg2 border-b border-l1 flex items-center px-6 gap-4">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {breadcrumbs.map((bc, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-l4 text-[13px]">/</span>}
            <button
              onClick={() => bc.to && navigate(bc.to)}
              className={[
                "text-[13px] whitespace-nowrap cursor-pointer",
                i === breadcrumbs.length - 1
                  ? "text-t2 font-medium cursor-default"
                  : "text-t5 hover:text-t3",
              ].join(" ")}
            >
              {bc.label}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="flex items-center gap-2 bg-s1 border border-l1 rounded-sm h-8 px-2.5 w-[200px] text-[12px] text-t5 hover:border-l2 transition cursor-text">
          <Search size={13} />
          <span className="flex-1 text-left">Search</span>
          <Kbd>⌘K</Kbd>
        </button>
        <IconButton aria-label="Notifications">
          <Bell size={14} />
        </IconButton>
        <IconButton aria-label="Log out" onClick={handleLogout}>
          <LogOut size={14} />
        </IconButton>
      </div>
    </header>
  );
};

export default Topbar;
