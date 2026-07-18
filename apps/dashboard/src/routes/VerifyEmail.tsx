import { useState, useEffect } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { Screen } from "../types";
import { tenants, auth } from "../api-client";
import { Btn } from "../components/Btn";
import { Card } from "../components/Card";
import { MinimalHeader } from "../components/MinimalHeader";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

export function VerifyEmail({ onNav }: { onNav: (s: Screen) => void }) {
  const [searchParams] = useSearchParams();
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const emailParam = searchParams.get("email") ?? "";
  const tokenParam = searchParams.get("token");

  useEffect(() => {
    if (!tokenParam) return;
    tenants.verify(tokenParam, emailParam)
      .then(res => {
        if (res.tenantId) sessionStorage.setItem("pendingTenantId", res.tenantId);
        if (emailParam) sessionStorage.setItem("pendingEmail", emailParam);
        auth.googleStart();
      })
      .catch(() => {});
  }, [tokenParam]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = () => {
    tenants.signup({ companyName: "", adminEmail: emailParam, adminName: "" }).catch(() => {});
    setResent(true);
    setCooldown(30);
  };

  return (
    <div className="min-h-[100dvh] bg-surface-tertiary font-body flex flex-col">
      {/* FLAG FOR PRODUCT: this lets someone abandon signup mid-flow with no
          confirmation. Decide if that's fine (they can just sign up again) or
          if this needs a "are you sure?" step before leaving. */}
      <MinimalHeader onBack={() => onNav("landing")} />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[28rem] text-center">
          <div className="w-16 h-16 rounded-xl bg-accent-cool-light flex items-center justify-center mx-auto mb-6">
            <Mail size={28} strokeWidth={1.5} className="text-accent-cool" />
          </div>
          <h1 className="text-heading text-text-primary mb-2">Check your inbox</h1>
          <p className="text-body text-text-secondary mb-1">We sent a verification link to</p>
          <p className="font-mono text-text-primary text-sm mb-6">{emailParam}</p>

          <Card className="p-6 mb-6 text-left">
            <ol className="space-y-3">
              {["Open the email from Inbox Sales Copilot", "Click the verification link", "You'll be redirected to your dashboard"].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                  <div className="w-5 h-5 rounded-full bg-accent-cool-light text-accent-cool text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <p className="text-sm text-text-secondary mb-2">Didn't receive the email?</p>
          {resent && cooldown === 0 ? (
            <button onClick={resend} className={`text-sm text-secondary font-medium hover:underline cursor-pointer ${focusRing}`}>Resend verification email</button>
          ) : resent ? (
            <p className="text-sm text-success flex items-center justify-center gap-1.5" role="status">
              <CheckCircle2 size={14} strokeWidth={1.5} /> Email resent — you can resend again in {cooldown}s.
            </p>
          ) : (
            <button onClick={resend} className={`text-sm text-secondary font-medium hover:underline cursor-pointer ${focusRing}`}>Resend verification email</button>
          )}
          <div className="mt-8">
            <Btn variant="ghost" size="sm" onClick={() => onNav("overview")}>Skip for now (demo) →</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
