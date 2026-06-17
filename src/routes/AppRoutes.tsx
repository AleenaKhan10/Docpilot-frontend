import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import SignupOrg from "../pages/auth/SignupOrg";
import AcceptInvite from "../pages/auth/AcceptInvite";
import SharePage from "../pages/share/SharePage";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import AuthOnlyRoute from "./AuthOnlyRoute";
import Dashbaord from "../pages/dashboard/Dashbaord";
import UploadVideo from "../pages/process/UploadVideo";
import AllDocuments from "../pages/documents/AllDocuments";
import DocumentDetail from "../pages/documents/DocumentDetail";
import CreateOrg from "../pages/org/CreateOrg";
import Team from "../pages/org/Team";
import Settings from "../pages/org/Settings";

const AppRoutes = () => {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
};

export default AppRoutes;
