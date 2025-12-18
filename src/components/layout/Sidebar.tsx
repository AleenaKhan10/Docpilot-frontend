import { NavLink } from "react-router-dom";
import { Video, Upload, FileText, Users, Settings } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all ${
      isActive ? "bg-blue-50 text-blue-700" : "text-gray-800 hover:bg-gray-100"
    }`;

  return (
    <div
      className={
        "bg-white shadow-md border-r border-gray-100 transition-all duration-200 " +
        (isOpen ? "w-64" : "w-64 hidden md:block")
      }
    >
      <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-100">
        <div className="h-10 w-10 rounded-md bg-blue-600/10 text-blue-700 flex items-center justify-center">
          <Video size={22} />
        </div>
        <div className="font-semibold text-gray-900">
          Video Documentation AI
        </div>
      </div>

      <nav className="p-4 space-y-2">
        <NavLink to="/" className={linkClasses} end>
          <FileText size={18} /> Dashboard
        </NavLink>
        <NavLink to="/upload" className={linkClasses}>
          <Upload size={18} /> Upload Video
        </NavLink>
        <NavLink to="/documents" className={linkClasses}>
          <FileText size={18} /> My Documents
        </NavLink>
        <NavLink to="/teams" className={linkClasses}>
          <Users size={18} />
          Users
        </NavLink>
        <NavLink to="/settings" className={linkClasses}>
          <Settings size={18} /> Settings
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
