import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * For routes that require an authenticated user but don't care about org
 * membership (e.g. /create-org, /accept-invite/:token).
 */
const AuthOnlyRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
};

export default AuthOnlyRoute;
