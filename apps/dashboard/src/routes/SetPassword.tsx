import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { Screen } from "../types";
import { auth } from "../api-client";
import { useAuthStore } from "../store/auth";
import { AuthLayout } from "../components/AuthLayout";
import { Card } from "../components/Card";
import { FormInput } from "../components/FormInput";
import { Btn } from "../components/Btn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

export function SetPassword({ onNav }: { onNav: (s: Screen) => void }) {
  const login = useAuthStore(s => s.login);
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [tenantId, setTenantId] = useState(params.get("tenantId") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState({ email: false, tenantId: false, password: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);

  const errs = {
    email: !email.trim() ? "Email is required" : !EMAIL_RE.test(email) ? "Enter a valid email" : "",
    tenantId: !tenantId.trim() ? "Tenant ID is required" : !UUID_RE.test(tenantId) ? "Enter a valid tenant ID" : "",
    password: !password ? "Password is required" : password.length < 8 ? "Minimum 8 characters" : "",
    confirm: confirm !== password ? "Passwords don't match" : "",
  };
  const valid = !errs.email && !errs.tenantId && !errs.password && !errs.confirm;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ email: true, tenantId: true, password: true, confirm: true });
    if (!valid) return;

    setSubmitting(true);
    setServerError("");
    try {
      await auth.setPassword(email, password, tenantId);
      const { token } = await auth.adminLogin(email, password);
      login(token, tenantId);
      setDone(true);
      const plan = localStorage.getItem("pendingPlan");
      localStorage.removeItem("pendingPlan");
      if (plan && plan !== "Enterprise") {
        setTimeout(() => window.location.replace(`/checkout?plan=${encodeURIComponent(plan)}`), 1500);
      } else {
        setTimeout(() => onNav("overview"), 1500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("400")) {
        setServerError("Tenant is not active or Google account not connected yet.");
      } else if (msg.includes("409")) {
        setServerError("Password already set. Sign in instead.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-[100dvh] bg-surface-secondary flex items-center justify-center px-4 py-10 font-body">
        <Card className="w-full max-w-[26rem] p-8 text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(10, 147, 150, 0.12)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h1 className="text-[22px] font-bold text-text-primary mb-2">Password set!</h1>
          <p className="text-[15px] text-text-secondary">Signing you in…</p>
        </Card>
      </div>
    );
  }

  return (
    <AuthLayout onBack={() => onNav("landing")}>
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight mb-1.5">
          Set your password
        </h1>
        <p className="text-[15px] text-text-secondary">Create a password for your admin account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInput
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={v => { setEmail(v); setServerError(""); }}
          onBlur={() => setTouched(t => ({ ...t, email: true }))}
          error={touched.email ? errs.email : ""}
          autoComplete="email"
          required
        />

        <FormInput
          label="Tenant ID"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={tenantId}
          onChange={v => { setTenantId(v); setServerError(""); }}
          onBlur={() => setTouched(t => ({ ...t, tenantId: true }))}
          error={touched.tenantId ? errs.tenantId : ""}
          hint="Your company's tenant ID from signup"
          required
        />

        <FormInput
          label="Password"
          type={showPass ? "text" : "password"}
          placeholder="Minimum 8 characters"
          value={password}
          onChange={v => { setPassword(v); setServerError(""); }}
          onBlur={() => setTouched(t => ({ ...t, password: true }))}
          error={touched.password ? errs.password : ""}
          autoComplete="new-password"
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              className="text-text-tertiary hover:text-text-secondary cursor-pointer"
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
            </button>
          }
        />

        <FormInput
          label="Confirm password"
          type={showPass ? "text" : "password"}
          placeholder="Re-enter your password"
          value={confirm}
          onChange={v => { setConfirm(v); setServerError(""); }}
          onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
          error={touched.confirm ? errs.confirm : ""}
          autoComplete="new-password"
          required
        />

        {serverError && (
          <p className="text-xs text-danger text-center">{serverError}</p>
        )}

        <Btn type="submit" loading={submitting} disabled={submitting} className="w-full mt-1">
          Set password
        </Btn>
      </form>

      <p className="text-center text-[14px] text-text-secondary mt-6">
        Already have a password?{" "}
        <button onClick={() => onNav("signin")} className={`text-secondary font-semibold hover:underline cursor-pointer ${focusRing}`}>Sign in</button>
      </p>
    </AuthLayout>
  );
}
