import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import type { Screen } from "../types";
import { tenants } from "../api-client";
import { AuthLayout } from "../components/AuthLayout";
import { Btn } from "../components/Btn";
import { FormInput } from "../components/FormInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

export function Signup({ onNav }: { onNav: (s: Screen) => void }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const plan = params.get("plan") ?? "Growth";
  const [company, setCompany] = useState(() => sessionStorage.getItem("signupCompany") ?? "");
  const [email, setEmail] = useState(() => sessionStorage.getItem("signupEmail") ?? "");
  const [touched, setTouched] = useState({ company: false, email: false });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const errs = {
    company: !company.trim() ? "Company name is required" : "",
    email: !email.trim() ? "Work email is required" : !EMAIL_RE.test(email) ? "Enter a valid email address" : "",
  };
  const valid = !errs.company && !errs.email;

  const submit = () => {
    setTouched({ company: true, email: true });
    setServerError("");
    if (!valid || submitting) return;
    setSubmitting(true);
    tenants.signup({ companyName: company, adminEmail: email, adminName: email.split("@")[0] })
      .then(() => {
        localStorage.setItem("pendingPlan", plan);
        sessionStorage.setItem("pendingEmail", email);
        sessionStorage.setItem("pendingCompanyName", company);
        sessionStorage.removeItem("signupCompany");
        sessionStorage.removeItem("signupEmail");
        onNav("verify");
      })
      .catch(err => {
        setServerError(err.message || "Something went wrong");
        setSubmitting(false);
      });
  };

  return (
    <AuthLayout onBack={() => onNav("landing")}>
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight mb-1.5">
          Register your company
        </h1>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={e => { e.preventDefault(); submit(); }}
        noValidate
      >
        <FormInput
          label="Company name" placeholder="Your company name" required
          value={company} onChange={setCompany}
          onBlur={() => setTouched(t => ({ ...t, company: true }))}
          error={touched.company ? errs.company : undefined}
          autoComplete="organization"
        />
        <FormInput
          label="Work email" type="email" placeholder="you@yourcompany.com" required
          value={email} onChange={setEmail}
          onBlur={() => setTouched(t => ({ ...t, email: true }))}
          error={touched.email ? errs.email : undefined}
          autoComplete="email"
        />
        {serverError && (
          <p className="text-xs text-danger text-center">{serverError}</p>
        )}

        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[13px] font-body font-medium text-text-primary tracking-[0.01em]">
            Choose your plan
          </span>
          <div
            className="flex items-center justify-between rounded-sm px-4 py-3 border-l-[3px]"
            style={{ borderLeftColor: "var(--brand-cyan)", backgroundColor: "rgba(148, 210, 189, 0.08)" }}
          >
            <span className="text-[14px] font-semibold text-text-primary">{plan}</span>
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem("signupCompany", company);
                sessionStorage.setItem("signupEmail", email);
                navigate({ pathname: "/", hash: "pricing" });
              }}
              className={`text-[13px] font-semibold px-3 py-1 rounded-sm transition-colors cursor-pointer ${focusRing}`}
              style={{ backgroundColor: "var(--brand-cyan)", color: "#FFFFFF" }}
            >
              Change
            </button>
          </div>
        </div>

        <Btn type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Btn>
      </form>

      <p className="text-[12px] text-text-tertiary text-center mt-5">
        By registering you agree to our{" "}
        <Link to="/terms" target="_blank" rel="noopener noreferrer" className={`text-secondary underline ${focusRing}`}>Terms</Link>
        {" "}and{" "}
        <Link to="/privacy" target="_blank" rel="noopener noreferrer" className={`text-secondary underline ${focusRing}`}>Privacy Policy</Link>.
      </p>

      <p className="text-center text-[14px] text-text-secondary mt-5">
        Already have an account?{" "}
        <button onClick={() => onNav("signin")} className={`text-secondary font-semibold hover:underline cursor-pointer ${focusRing}`}>
          Sign in
        </button>
      </p>
    </AuthLayout>
  );
}
