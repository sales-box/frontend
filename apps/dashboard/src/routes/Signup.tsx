import { useState } from "react";
import { Inbox, Zap, Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { Screen } from "../types";
import { tenants } from "../api-client";
import { Btn } from "../components/Btn";
import { Card } from "../components/Card";
import { FormInput } from "../components/FormInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

export function Signup({ onNav }: { onNav: (s: Screen) => void }) {
  const [params] = useSearchParams();
  const plan = params.get("plan") ?? "Growth";
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

          <div className="flex items-center gap-2 bg-accent-cool-light rounded-md px-3 py-2.5 mb-5">
            <Zap size={13} strokeWidth={1.5} className="text-accent-cool" />
            <span className="text-[13px] text-text-primary">
              Selected plan: <span className="font-semibold text-accent-cool">{plan}</span>
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
            {serverError && (
              <p className="text-xs text-danger text-center">{serverError}</p>
            )}

            <Btn type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </Btn>

          </form>

          <p className="text-xs text-text-tertiary text-center mt-4">
            By registering you agree to our <a href="#" className={`text-secondary underline ${focusRing}`}>Terms</a> and <a href="#" className={`text-secondary underline ${focusRing}`}>Privacy Policy</a>.
          </p>
        </Card>

        <p className="text-center text-sm text-text-secondary mt-5">
          Already have an account? <button onClick={() => onNav("signin")} className={`text-secondary font-medium hover:underline cursor-pointer ${focusRing}`}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
