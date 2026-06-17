import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { OrgProvider } from "./contexts/OrgContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <OrgProvider>
        <App />
      </OrgProvider>
    </AuthProvider>
  </StrictMode>
);
