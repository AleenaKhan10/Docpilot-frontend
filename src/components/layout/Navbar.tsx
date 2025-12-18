import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import Input from "../ui/Input";

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  return (
    <div className="h-16 bg-white shadow-md flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden rounded-md p-2 hover:bg-gray-100"
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:block w-[360px]">
          <Input
            placeholder="Search documents"
            variant="filled"
            inputSize="md"
            leftIcon={<Search size={18} />}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-md p-2 hover:bg-red-100 hover:text-red-500 cursor-pointer">
          <LogOut size={20} />
        </button>
        <button className="relative rounded-md p-2 hover:bg-gray-100">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
            2
          </span>
        </button>
        <div className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
            JD
          </div>
          <ChevronDown size={18} />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
