import { type ReactNode, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import type { Screen } from "./types";
import { useAuthStore } from "./store/auth";
import { useThemeStore } from "./store/theme";
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
import { Plans } from "./routes/dashboard/Plans";
import { ExtensionDownload } from "./routes/ExtensionDownload";
import { Privacy } from "./routes/Privacy";
import { Terms } from "./routes/Terms";
import { Security } from "./routes/Security";
import { PlatformLogin } from "./routes/platform/PlatformLogin";
import { PlatformTenants } from "./routes/platform/PlatformTenants";
import { PlatformTenantDetail } from "./routes/platform/PlatformTenantDetail";
import { usePlatformAuthStore } from "./store/platformAuth";
import { useTenant } from "./hooks/queries";

const Checkout = lazy(() => import("./routes/Checkout").then(m => ({ default: m.Checkout })));

const PATHS: Record<Screen, string> = {
  landing: "/",
  signin: "/signin",
  signup: "/signup",
  verify: "/verify",
  "auth-callback": "/callback",
  "set-password": "/set-password",
  checkout: "/checkout",
  plans: "/dashboard/plans",
  overview: "/dashboard",
  "knowledge-base": "/dashboard/knowledge",
  team: "/dashboard/team",
  crm: "/dashboard/crm",
  analytics: "/dashboard/analytics",
  clients: "/dashboard/clients",
  "client-record": "/dashboard/clients/:id",
  "activity-feed": "/dashboard/activity",
  settings: "/dashboard/settings",
  "extension-download": "/extension-download",
};

function PaywallGate({ children }: { children: ReactNode }) {
  const { data: tenant, isLoading } = useTenant();
  if (isLoading) return null;
  if (tenant && tenant.subscriptionStatus !== "active") {
    return <Navigate to="/dashboard/plans" replace />;
  }
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <PaywallGate>{children}</PaywallGate>;
}

function ProtectedRouteNoPaywall({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

function PlatformProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = usePlatformAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);
  const onNav = (s: Screen) => navigate(PATHS[s]);
  const onLogout = () => { logout(); navigate("/signin"); };
  useThemeStore();

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Landing onNav={onNav} />} />
        <Route path="/signin" element={<SignIn onNav={onNav} />} />
        <Route path="/signup" element={<Signup onNav={onNav} />} />
        <Route path="/verify" element={<VerifyEmail onNav={onNav} />} />
        <Route path="/callback" element={<AuthCallback onNav={onNav} />} />
        <Route path="/set-password" element={<SetPassword onNav={onNav} />} />
        <Route path="/checkout" element={<Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-text-tertiary">Loading…</div>}><Checkout onNav={onNav} /></Suspense>} />
        <Route path="/checkout/success" element={<Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-text-tertiary">Loading…</div>}><Checkout onNav={onNav} /></Suspense>} />
        {/* Public extension download page — NO ProtectedRoute, intentionally.
            SEs reach this from their invite email. They have no dashboard login.
            DO NOT nest inside /dashboard or wrap in <ProtectedRoute>. */}
        <Route path="/extension-download" element={<ExtensionDownload onNav={onNav} />} />
        {/* Public legal pages — no auth required, linked from the homepage footer. */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/security" element={<Security />} />
        <Route path="/dashboard" element={<ProtectedRoute><Overview onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/knowledge" element={<ProtectedRoute><KnowledgeBase onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/team" element={<ProtectedRoute><Team onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/crm" element={<ProtectedRoute><CRMConnect onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/clients" element={<ProtectedRoute><Clients onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/clients/:id" element={<ProtectedRoute><ClientRecord onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/activity" element={<ProtectedRoute><ActivityFeed onNav={onNav} onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRouteNoPaywall><Settings onNav={onNav} onLogout={onLogout} /></ProtectedRouteNoPaywall>} />
        {/* Plans is outside the paywall: an unpaid tenant must be able to pick a plan. */}
        <Route path="/dashboard/plans" element={
          <ProtectedRouteNoPaywall><Plans onNav={onNav} onLogout={onLogout} /></ProtectedRouteNoPaywall>
        } />
        {/* Platform-operator console — separate identity + session (platformJwt). */}
        <Route path="/admin/login" element={<PlatformLogin />} />
        <Route path="/admin" element={<PlatformProtectedRoute><PlatformTenants /></PlatformProtectedRoute>} />
        <Route path="/admin/tenants/:id" element={<PlatformProtectedRoute><PlatformTenantDetail /></PlatformProtectedRoute>} />
        <Route path="*" element={<NotFound onNav={onNav} />} />
      </Routes>
    </ToastProvider>
  );
}
