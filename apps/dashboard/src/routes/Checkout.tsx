import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, CreditCard, Shield, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Screen } from "../types";
import { payments, tenants, isLoggedIn } from "../api-client";
import { AuthLayout } from "../components/AuthLayout";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";
import { PRICING_TIERS, type PricingTier } from "../data/pricingTiers";

function CheckoutForm({ plan }: { plan: PricingTier }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    if (plan.priceCents == null) {
      setError("This plan is quoted per customer. Please contact sales.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { url } = await payments.createCheckoutSession(plan.tier);
      window.location.href = url;
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Could not start checkout. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight mb-1.5">
          Complete your subscription
        </h1>
        <p className="text-[15px] text-text-secondary">You'll be redirected to Stripe to enter your payment details.</p>
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-text-tertiary">{plan.name} Plan</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[24px] font-bold text-text-primary">{plan.priceLabel}</span>
              <span className="text-[13px] text-text-tertiary">{plan.period}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(148, 210, 189, 0.12)" }}>
            <CreditCard size={18} strokeWidth={1.5} className="text-secondary" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--brand-cyan)" }} /> {plan.seats}</span>
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--brand-orange)" }} /> {plan.docs}</span>
        </div>
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-[14px]">
          <span className="font-semibold text-text-primary">Total due today</span>
          <span className="font-bold text-text-primary">{plan.priceLabel}{plan.period}</span>
        </div>
      </Card>

      {error && <p className="text-[13px] text-danger text-center mb-4">{error}</p>}

      <Btn size="lg" className="w-full" loading={loading} onClick={handleSubscribe}>
        {loading ? "Redirecting to Stripe…" : `Subscribe — ${plan.priceLabel}${plan.period}`}
      </Btn>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-tertiary mt-4">
        <Shield size={12} strokeWidth={1.5} />
        <span>Secure payment powered by Stripe</span>
      </div>
    </>
  );
}

function StatusCard({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-surface-secondary flex items-center justify-center px-5 py-10 font-body">
      <div className="w-full max-w-[26rem]">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#0A9396" }}>
            <span className="text-white font-bold text-[15px] leading-none">S</span>
          </div>
          <span className="font-semibold text-[16px] text-text-primary tracking-tight">SalesBox</span>
        </div>
        <Card className="p-8 text-center">
          {icon}
          <h1 className="text-[22px] font-bold text-text-primary mb-2">{title}</h1>
          <p className="text-[15px] text-text-secondary mb-1">{description}</p>
          {action && <div className="mt-5">{action}</div>}
        </Card>
      </div>
    </div>
  );
}

function CheckoutSuccess({ onNav }: { onNav: (s: Screen) => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"polling" | "done" | "timeout">("polling");

  const poll = useCallback(() => {
    let attempts = 0;
    const max = 30;
    const iv = setInterval(async () => {
      attempts++;
      try {
        const t = await tenants.get();
        if (t.subscriptionStatus === "active") {
          clearInterval(iv);
          setStatus("done");
          qc.invalidateQueries({ queryKey: ["tenant"] });
          localStorage.removeItem("pendingPlan");
          setTimeout(() => onNav("overview"), 2500);
        }
      } catch { /* ignore */ }
      if (attempts >= max) {
        clearInterval(iv);
        setStatus("timeout");
      }
    }, 2000);
    return iv;
  }, [onNav, qc]);

  useEffect(() => {
    const iv = poll();
    return () => clearInterval(iv);
  }, [poll]);

  const iconWrap = "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5";

  if (status === "done") {
    return (
      <StatusCard
        icon={<div className={iconWrap} style={{ backgroundColor: "rgba(10, 147, 150, 0.12)" }}><Check size={26} strokeWidth={2} className="text-success" /></div>}
        title="Payment successful!"
        description="Redirecting to your dashboard…"
      />
    );
  }

  if (status === "timeout") {
    return (
      <StatusCard
        icon={<div className={iconWrap} style={{ backgroundColor: "rgba(148, 210, 189, 0.12)" }}><Check size={26} strokeWidth={2} className="text-secondary" /></div>}
        title="Payment received"
        description="Your payment is being processed. It may take a moment to activate your account."
        action={<Btn variant="primary" onClick={() => onNav("overview")} className="w-full">Go to dashboard</Btn>}
      />
    );
  }

  return (
    <StatusCard
      icon={<div className={iconWrap} style={{ backgroundColor: "rgba(148, 210, 189, 0.12)" }}><Loader2 size={28} className="animate-spin text-secondary" /></div>}
      title="Activating your account…"
      description="This usually takes a few seconds."
    />
  );
}

export function Checkout({ onNav }: { onNav: (s: Screen) => void }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");
  const canceled = params.get("canceled");

  const planKey = params.get("plan") ?? localStorage.getItem("pendingPlan") ?? "Growth";
  const plan = PRICING_TIERS.find(t => t.name === planKey || String(t.tier) === planKey);

  useEffect(() => {
    if (!isLoggedIn()) window.location.replace("/signin");
  }, []);

  if (sessionId) {
    return <CheckoutSuccess onNav={onNav} />;
  }

  if (canceled) {
    return (
      <StatusCard
        icon={<div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "rgba(238, 155, 0, 0.1)" }}><CreditCard size={26} strokeWidth={1.5} className="text-warning" /></div>}
        title="Payment canceled"
        description="No charges were made. You can try again anytime."
        action={<Btn variant="primary" onClick={() => navigate(`/checkout?plan=${planKey}`)} className="w-full">Try again</Btn>}
      />
    );
  }

  if (!plan) {
    return (
      <StatusCard
        icon={<div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "rgba(174, 32, 18, 0.1)" }}><CreditCard size={26} strokeWidth={1.5} className="text-danger" /></div>}
        title="Invalid plan"
        description="The selected plan is not available."
        action={<Btn variant="primary" onClick={() => onNav("plans")} className="w-full">Back to plans</Btn>}
      />
    );
  }

  return (
    <AuthLayout onBack={() => onNav("plans")}>
      <CheckoutForm plan={plan} />
      <p className="text-center text-[12px] text-text-tertiary mt-5">
        Billed monthly · Cancel anytime
      </p>
    </AuthLayout>
  );
}
