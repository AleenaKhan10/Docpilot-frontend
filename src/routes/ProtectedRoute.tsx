import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import RouteErrorBoundary from "../components/RouteErrorBoundary";

/**
 * Gate for routes that require a Supabase session AND an active organization.
 * - Not signed in -> /login
 * - Signed in but no orgs -> /create-org
 * - Otherwise renders the child route, wrapped in a per-route error
 *   boundary so one page's crash doesn't take down the whole app shell.
 */
const ProtectedRoute = () => {
  const { session, loading: authLoading } = useAuth();
  const { orgs, loading: orgLoading } = useOrg();
  const location = useLocation();

  // Only blank-out on the *initial* load, not on background refreshes.
  // Once orgs are populated, keep rendering the previous UI even if a
  // refetch is in flight — otherwise the whole app flashes blank every
  // time Supabase silently refreshes the auth token.
  const initialOrgLoad = orgLoading && orgs.length === 0;
  if (authLoading || (session && initialOrgLoad)) return null;

  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;

  if (orgs.length === 0 && location.pathname !== "/create-org") {
    return <Navigate to="/create-org" replace />;
  }

  return (
    <RouteErrorBoundary resetKey={location.pathname}>
      <Outlet />
    </RouteErrorBoundary>
  );
};

export default ProtectedRoute;
