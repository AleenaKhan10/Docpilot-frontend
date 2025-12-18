import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const ProtectedRoute = () => {
  const isAuthenticated = true;
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null; // loading
  return isSignedIn ? <Outlet /> : <Navigate to="/login" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
