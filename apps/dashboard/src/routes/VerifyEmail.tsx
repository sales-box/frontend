import { useState, useEffect } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { Screen } from "../types";
import { tenants, auth } from "../api-client";
import { AuthLayout } from "../components/AuthLayout";
import { Card } from "../components/Card";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

export function VerifyEmail({ onNav }: { onNav: (s: Screen) => void }) {
  const [searchParams] = useSearchParams();
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const emailParam = searchParams.get("email") ?? sessionStorage.getItem("pendingEmail") ?? "";
  const companyParam = sessionStorage.getItem("pendingCompanyName") ?? "";
  const tokenParam = searchParams.get("token");

  useEffect(() => {
    if (!tokenParam) return;
    tenants.verify(tokenParam, emailParam)
      .then(res => {
        if (res.tenantId) sessionStorage.setItem("pendingTenantId", res.tenantId);
        if (emailParam) sessionStorage.setItem("pendingEmail", emailParam);
        auth.googleStart();
      })
      // Was `.catch(() => {})`. A link that had expired, been superseded by a
      // resend, or been opened from the wrong mailbox left the user staring at
      // "Check your inbox" forever with no clue that anything had failed.
      .catch((err: unknown) => {
        setError(
          err instanceof Error && err.message
            ? `${err.message} Request a new link below.`
            : "That verification link is no longer valid. Request a new one below.",
        );
      });
  }, [tokenParam, emailParam]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = () => {
    // This used to be `if (!emailParam) return;` — a silent no-op. The address
    // comes from the URL or from sessionStorage, and sessionStorage is
    // per-tab, so anyone who reopened /verify in a new tab (or came back later)
    // got a Resend button that did nothing at all: no request, no error, no
    // feedback. That is the "resend doesn't resend anything" report.
    if (!emailParam) {
      setError("We don't know which address to send to. Open the link from your signup email, or sign up again.");
      return;
    }
    if (sending) return;

    setSending(true);
    setError("");
    tenants.resendVerification({ email: emailParam, companyName: companyParam || undefined })
      .then(() => {
        setResent(true);
        setCooldown(30);
      })
      // Previously `.catch(() => {})`: a 400, a 404 or an SMTP outage all
      // looked identical to success — the user sat waiting for an email the
      // server never sent.
      .catch((err: unknown) => {
        setError(err instanceof Error && err.message ? err.message : "We couldn't resend the email. Please try again.");
      })
      .finally(() => setSending(false));
  };

  return (
    <AuthLayout onBack={() => onNav("landing")}>
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "rgba(148, 210, 189, 0.15)" }}
        >
          <Mail size={28} strokeWidth={1.5} className="text-secondary" />
        </div>

        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight mb-2">
          Check your inbox
        </h1>
        <p className="text-[15px] text-text-secondary mb-1">We sent a verification link to</p>
        <p className="font-mono text-text-primary text-[14px] mb-6">{emailParam}</p>

        <Card className="p-5 mb-6 text-left">
          <ol className="space-y-3">
            {["Open the email from SalesBox", "Click the verification link", "You'll be redirected to your dashboard"].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] text-text-secondary">
                <div
                  className="w-6 h-6 rounded-full text-[12px] font-semibold flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(148, 210, 189, 0.15)", color: "var(--color-secondary)" }}
                >
                  {i + 1}
                </div>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>

        <p className="text-[14px] text-text-secondary mb-2">Didn't receive the email?</p>
        {resent && cooldown > 0 ? (
          <p className="text-[14px] text-success flex items-center justify-center gap-1.5" role="status">
            <CheckCircle2 size={14} strokeWidth={1.5} /> Email resent — you can resend again in {cooldown}s.
          </p>
        ) : (
          <button
            onClick={resend}
            disabled={sending}
            className={`text-[14px] text-secondary font-semibold hover:underline cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`}
          >
            {sending ? "Sending…" : "Resend verification email"}
          </button>
        )}
        {error && (
          <p className="text-[13px] text-danger mt-2" role="alert">{error}</p>
        )}
        <p className="text-[14px] text-text-secondary mt-6">
          Already verified?{" "}
          <button onClick={() => onNav("signin")} className={`text-secondary font-semibold hover:underline cursor-pointer ${focusRing}`}>Sign in</button>
        </p>
      </div>
    </AuthLayout>
  );
}
