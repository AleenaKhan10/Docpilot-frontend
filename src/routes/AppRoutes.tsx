import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import Dashbaord from "../pages/dashboard/Dashbaord";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import UploadVideo from "../pages/process/UploadVideo";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        {/* <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashbaord />} />
        </Route> */}

        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Dashbaord />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        <Route path="/upload" element={<UploadVideo />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
