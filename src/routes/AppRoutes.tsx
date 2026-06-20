import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute";
import AuthOnlyRoute from "./AuthOnlyRoute";

// Every page is lazy-loaded. The initial bundle drops from ~970 KB to
// the bare framework + contexts + the small route shell — each page
// downloads its own chunk only when it's actually visited, and the
// browser caches those chunks for navigations after the first one.
const Login = lazy(() => import("../pages/auth/Login"));
const SignupOrg = lazy(() => import("../pages/auth/SignupOrg"));
const AcceptInvite = lazy(() => import("../pages/auth/AcceptInvite"));
const SharePage = lazy(() => import("../pages/share/SharePage"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Dashbaord = lazy(() => import("../pages/dashboard/Dashbaord"));
const UploadVideo = lazy(() => import("../pages/process/UploadVideo"));
const AllDocuments = lazy(() => import("../pages/documents/AllDocuments"));
const DocumentDetail = lazy(() => import("../pages/documents/DocumentDetail"));
const CreateOrg = lazy(() => import("../pages/org/CreateOrg"));
const Team = lazy(() => import("../pages/org/Team"));
const Settings = lazy(() => import("../pages/org/Settings"));

// Match the dark theme background so the brief "chunk is loading"
// gap reads as a soft fade rather than a white flash.
const RouteFallback = () => <div className="h-screen w-screen bg-bg" />;

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupOrg />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />
          <Route path="/share/:token" element={<SharePage />} />

          {/* Authed, no org required */}
          <Route element={<AuthOnlyRoute />}>
            <Route path="/create-org" element={<CreateOrg />} />
          </Route>

          {/* Authed + member of an org */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashbaord />} />
            <Route path="/upload" element={<UploadVideo />} />
            <Route path="/documents" element={<AllDocuments />} />
            <Route path="/documents/:id" element={<DocumentDetail />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRoutes;
