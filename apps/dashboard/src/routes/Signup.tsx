import { useState } from "react";
import { Inbox, Zap, Eye, EyeOff } from "lucide-react";
import type { Screen } from "../types";
import { tenants, auth } from "../api-client";
import { Btn } from "../components/Btn";
import { Card } from "../components/Card";
import { FormInput } from "../components/FormInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-sm";

export function Signup({ onNav }: { onNav: (s: Screen) => void }) {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState({ company: false, email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const errs = {
    company: !company.trim() ? "Company name is required" : "",
    email: !email.trim() ? "Work email is required" : !EMAIL_RE.test(email) ? "Enter a valid email address" : "",
    password: password.length < 8 ? "Password must be at least 8 characters" : "",
  };
  const valid = !errs.company && !errs.email && !errs.password;

  const submit = () => {
    setTouched({ company: true, email: true, password: true });
    setServerError("");
    if (!valid || submitting) return;
    setSubmitting(true);
    tenants.signup({ companyName: company, adminEmail: email, adminName: email.split("@")[0] })
      .then(() => onNav("verify"))
      .catch(err => {
        setServerError(err.message || "Something went wrong");
        setSubmitting(false);
      });
  };

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
          <div className="mb-6">
            <h1 className="text-heading text-text-primary mb-1">Register your company</h1>
            <p className="text-body text-text-secondary">Set up your admin account and start your 14-day trial.</p>
          </div>

          <div className="flex items-center gap-2 bg-accent-light rounded-md px-3 py-2.5 mb-5">
            <Zap size={13} strokeWidth={1.5} className="text-accent" />
            <span className="text-[13px] text-text-primary">
              Selected plan: <span className="font-semibold text-accent">Growth</span>
            </span>
            <button onClick={() => onNav("landing")} className={`ml-auto text-xs text-text-tertiary hover:text-text-primary underline cursor-pointer ${focusRing}`}>Change</button>
          </div>

          <form
            className="space-y-4"
            onSubmit={e => { e.preventDefault(); submit(); }}
            noValidate
          >
            <FormInput
              label="Company name" placeholder="Acme Corporation" required
              value={company} onChange={setCompany}
              onBlur={() => setTouched(t => ({ ...t, company: true }))}
              error={touched.company ? errs.company : undefined}
              autoComplete="organization"
            />
            <FormInput
              label="Work email" type="email" placeholder="jane@acme.com" required
              value={email} onChange={setEmail}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              error={touched.email ? errs.email : undefined}
              autoComplete="email"
            />
            <FormInput
              label="Password" type={showPass ? "text" : "password"} placeholder="8+ characters" required
              value={password} onChange={setPassword}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              error={touched.password ? errs.password : undefined}
              autoComplete="new-password"
              hint="Use at least 8 characters."
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className={`text-text-tertiary hover:text-text-primary cursor-pointer ${focusRing}`}
                >
                  {showPass ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                </button>
              }
            />
            <Btn type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </Btn>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-border" /><span className="text-xs text-text-tertiary">or</span><div className="flex-1 h-px bg-border" />
            </div>

            <button
              type="button"
              onClick={() => auth.googleStart()}
              className={`w-full flex items-center justify-center gap-2.5 bg-surface border border-border rounded-sm px-4 py-2.5 text-[13px] font-medium text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer ${focusRing}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="text-xs text-text-tertiary text-center mt-4">
            By registering you agree to our <a href="#" className={`text-accent underline ${focusRing}`}>Terms</a> and <a href="#" className={`text-accent underline ${focusRing}`}>Privacy Policy</a>.
          </p>
        </Card>

        <p className="text-center text-sm text-text-secondary mt-5">
          Already have an account? <button onClick={() => onNav("signin")} className={`text-accent font-medium hover:underline cursor-pointer ${focusRing}`}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
