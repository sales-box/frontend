import { useState, useEffect, type ReactNode } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import type { Screen } from "./types";
import { useAuthStore } from "./store/auth";
import { ToastProvider } from "./components/Toast";
import { Landing } from "./routes/Landing";
import { SignIn } from "./routes/SignIn";
import { Signup } from "./routes/Signup";
import { VerifyEmail } from "./routes/VerifyEmail";
import { AuthCallback } from "./routes/AuthCallback";
import { SetPassword } from "./routes/SetPassword";
import { NotFound } from "./routes/NotFound";
import { Overview } from "./routes/dashboard/Overview";
import { KnowledgeBase } from "./routes/dashboard/KnowledgeBase";
import { Team } from "./routes/dashboard/Team";
import { CRMConnect } from "./routes/dashboard/CRMConnect";
import { Analytics } from "./routes/dashboard/Analytics";
import { Clients } from "./routes/dashboard/Clients";
import { ClientRecord } from "./routes/dashboard/ClientRecord";
import { ActivityFeed } from "./routes/dashboard/ActivityFeed";
import { Settings } from "./routes/dashboard/Settings";
import { ExtensionDownload } from "./routes/ExtensionDownload";
import { Checkout } from "./routes/Checkout";

const PATHS: Record<Screen, string> = {
  landing: "/",
  signin: "/signin",
  signup: "/signup",
  verify: "/verify",
  "auth-callback": "/callback",
  "set-password": "/set-password",
  checkout: "/checkout",
  overview: "/dashboard",
  "knowledge-base": "/dashboard/knowledge",
  team: "/dashboard/team",
  crm: "/dashboard/crm",
  analytics: "/dashboard/analytics",
  clients: "/dashboard/clients",
  "client-record": "/dashboard/clients/:id",
  "activity-feed": "/dashboard/activity",
  settings: "/dashboard/settings",
  // Public route — no auth required. Must stay top-level (not /dashboard/*).
  "extension-download": "/extension-download",
};

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

function DarkToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className="fixed top-3 right-3 z-[550] w-9 h-9 flex items-center justify-center bg-surface border border-border text-text-secondary rounded-sm cursor-pointer hover:bg-surface-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
    >
      {dark ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
    </button>
  );
}

export default function App() {
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);
  const onNav = (s: Screen) => navigate(PATHS[s]);
  const onLogout = () => { logout(); navigate("/signin"); };
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <ToastProvider>
      <DarkToggle dark={dark} onToggle={() => setDark(d => !d)} />
      <Routes>
        <Route path="/" element={<Landing onNav={onNav} />} />
        <Route path="/signin" element={<SignIn onNav={onNav} />} />
        <Route path="/signup" element={<Signup onNav={onNav} />} />
        <Route path="/verify" element={<VerifyEmail onNav={onNav} />} />
        <Route path="/callback" element={<AuthCallback onNav={onNav} />} />
        <Route path="/set-password" element={<SetPassword onNav={onNav} />} />
        <Route path="/checkout" element={<Checkout onNav={onNav} />} />
        {/* Public extension download page — NO ProtectedRoute, intentionally.
            SEs reach this from their invite email. They have no dashboard login.
            DO NOT nest inside /dashboard or wrap in <ProtectedRoute>. */}
        <Route path="/extension-download" element={<ExtensionDownload onNav={onNav} />} />
        <Route path="/dashboard" element={<ProtectedRoute><Overview onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/knowledge" element={<ProtectedRoute><KnowledgeBase onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/team" element={<ProtectedRoute><Team onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/crm" element={<ProtectedRoute><CRMConnect onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/clients" element={<ProtectedRoute><Clients onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/clients/:id" element={<ProtectedRoute><ClientRecord onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/activity" element={<ProtectedRoute><ActivityFeed onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><Settings onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="*" element={<NotFound onNav={onNav} />} />
      </Routes>
    </ToastProvider>
  );
}
