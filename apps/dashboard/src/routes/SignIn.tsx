import { useState } from "react";
import { Inbox, Eye, EyeOff } from "lucide-react";
import type { Screen } from "../types";
import { auth } from "../api-client";
import { useAuthStore } from "../store/auth";
import { Card } from "../components/Card";
import { FormInput } from "../components/FormInput";
import { Btn } from "../components/Btn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

export function SignIn({ onNav }: { onNav: (s: Screen) => void }) {
  const login = useAuthStore(s => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const errs = {
    email: !email.trim() ? "Email is required" : !EMAIL_RE.test(email) ? "Enter a valid email" : "",
    password: !password ? "Password is required" : "",
  };
  const valid = !errs.email && !errs.password;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!valid) return;

    setSubmitting(true);
    setServerError("");
    try {
      const res = await auth.adminLogin(email, password);
      login(res.token);
      onNav("overview");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (msg.includes("401")) {
        setServerError("Invalid email or password.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
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
            <h1 className="text-heading text-text-primary mb-1">Sign in</h1>
            <p className="text-body text-text-secondary">Access your admin account.</p>
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
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={v => { setPassword(v); setServerError(""); }}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              error={touched.password ? errs.password : ""}
              autoComplete="current-password"
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

            {serverError && (
              <p className="text-xs text-danger text-center">{serverError}</p>
            )}

            <Btn type="submit" loading={submitting} disabled={submitting} className="w-full mt-1">
              Sign in
            </Btn>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-tertiary">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={() => auth.googleStart()}
            className={`w-full flex items-center justify-center gap-2.5 bg-surface border border-border rounded-sm px-4 py-3 text-[13px] font-medium text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer ${focusRing}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </Card>

        <p className="text-center text-sm text-text-secondary mt-5">
          Don't have an account?{" "}
          <button onClick={() => onNav("signup")} className={`text-secondary font-medium hover:underline cursor-pointer ${focusRing}`}>Register your company</button>
        </p>
      </div>
    </div>
  );
}
