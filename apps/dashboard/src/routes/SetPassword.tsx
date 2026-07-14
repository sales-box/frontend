import { useState } from "react";
import { Inbox, Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { Screen } from "../types";
import { auth } from "../api-client";
import { useAuthStore } from "../store/auth";
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
      const plan = sessionStorage.getItem("pendingPlan");
      sessionStorage.removeItem("pendingPlan");
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
      <div className="min-h-[100dvh] bg-surface-tertiary flex items-center justify-center px-4 py-10 font-body">
        <Card className="w-full max-w-[28rem] p-6 sm:p-8 text-center">
          <h1 className="text-heading text-text-primary mb-2">Password set!</h1>
          <p className="text-body text-text-secondary">Signing you in…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-tertiary flex items-center justify-center px-4 py-10 font-body">
      <div className="w-full max-w-[28rem]">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Inbox size={15} strokeWidth={1.5} className="text-text-on-primary" />
          </div>
          <span className="font-body font-semibold text-base text-text-primary">Inbox Sales Copilot</span>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-heading text-text-primary mb-1">Set your password</h1>
            <p className="text-body text-text-secondary">Create a password for your admin account.</p>
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
        </Card>

        <p className="text-center text-sm text-text-secondary mt-5">
          Already have a password?{" "}
          <button onClick={() => onNav("signin")} className={`text-secondary font-medium hover:underline cursor-pointer ${focusRing}`}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
