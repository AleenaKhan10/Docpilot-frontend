import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Logo from "../components/layout/Logo";

const NotFound = () => (
  <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
    <div className="flex items-center gap-2.5 mb-8">
      <div className="w-7 h-7 bg-white text-bg rounded-md flex items-center justify-center">
        <Logo size={14} />
      </div>
      <span className="text-[14px] font-semibold tracking-tight text-white">
        DocPilot
      </span>
    </div>
    <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-t5 mb-3">
      404 · Not Found
    </div>
    <h1 className="text-[20px] font-semibold tracking-tight text-white mb-1.5">
      Page not found
    </h1>
    <p className="text-[13px] text-t4 mb-8">
      The page you're looking for doesn't exist or you don't have access.
    </p>
    <div className="flex gap-2">
      <Link to="/">
        <Button variant="primary">Go to dashboard</Button>
      </Link>
      <Link to="/login">
        <Button variant="ghost">Sign in</Button>
      </Link>
    </div>
  </div>
);

export default NotFound;
