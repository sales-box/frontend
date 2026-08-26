import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, CreditCard, Shield, Loader2 } from "lucide-react";
import { MinimalHeader } from "../components/MinimalHeader";
import { useQueryClient } from "@tanstack/react-query";
import type { Screen } from "../types";
import { payments, tenants, isLoggedIn } from "../api-client";
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
    <Card className="p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-heading text-text-primary mb-1">Complete your subscription</h2>
        <p className="text-body text-text-secondary">You'll be redirected to Stripe to enter your payment details.</p>
      </div>

      <div className="bg-surface-secondary/50 border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-bold tracking-[0.06em] uppercase text-text-tertiary">{plan.name} Plan</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-text-primary">{plan.priceLabel}</span>
              <span className="text-sm text-text-tertiary">{plan.period}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 14%, transparent)" }}>
            <CreditCard size={18} strokeWidth={1.5} className="text-primary" />
          </div>
        </div>
        <div className="flex flex-col gap-1 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> {plan.seats}</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {plan.docs}</span>
        </div>
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-sm">
          <span className="font-semibold text-text-primary">Total due today</span>
          <span className="font-bold text-text-primary">{plan.priceLabel}{plan.period}</span>
        </div>
      </div>

      {error && <p className="text-xs text-danger text-center mb-4">{error}</p>}

      <Btn variant="gradient" size="lg" className="w-full" loading={loading} onClick={handleSubscribe}>
        {loading ? "Redirecting to Stripe…" : `Subscribe — ${plan.priceLabel}${plan.period}`}
      </Btn>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-tertiary mt-4">
        <Shield size={12} strokeWidth={1.5} />
        <span>Secure payment powered by Stripe</span>
      </div>
    </Card>
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

  if (status === "done") {
    return (
      <Card className="p-6 sm:p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
          <Check size={22} strokeWidth={2} className="text-success" />
        </div>
        <h2 className="text-heading text-text-primary mb-2">Payment successful!</h2>
        <p className="text-body text-text-secondary">Redirecting to your dashboard…</p>
      </Card>
    );
  }

  if (status === "timeout") {
    return (
      <Card className="p-6 sm:p-8 text-center">
        <h2 className="text-heading text-text-primary mb-2">Payment received</h2>
        <p className="text-body text-text-secondary mb-4">
          Your payment is being processed. It may take a moment to activate your account.
        </p>
        <Btn variant="primary" onClick={() => onNav("overview")}>
          Go to dashboard
        </Btn>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8 text-center">
      <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
      <h2 className="text-heading text-text-primary mb-2">Activating your account…</h2>
      <p className="text-body text-text-secondary">This usually takes a few seconds.</p>
    </Card>
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
    return (
      <div className="min-h-[100dvh] bg-surface-tertiary font-body flex flex-col">
        <MinimalHeader onBack={() => onNav("plans")} />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-[28rem]">
            <CheckoutSuccess onNav={onNav} />
          </div>
        </div>
      </div>
    );
  }

  if (canceled) {
    return (
      <div className="min-h-[100dvh] bg-surface-tertiary font-body flex flex-col">
        <MinimalHeader onBack={() => onNav("plans")} />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <Card className="w-full max-w-[28rem] p-6 sm:p-8 text-center">
            <h2 className="text-heading text-text-primary mb-2">Payment canceled</h2>
            <p className="text-body text-text-secondary mb-4">No charges were made. You can try again anytime.</p>
            <Btn variant="primary" onClick={() => navigate(`/checkout?plan=${planKey}`)}>
              Try again
            </Btn>
          </Card>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-[100dvh] bg-surface-tertiary font-body flex flex-col">
        <MinimalHeader onBack={() => onNav("landing")} />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <Card className="w-full max-w-[28rem] p-6 sm:p-8 text-center">
            <h1 className="text-heading text-text-primary mb-2">Invalid plan</h1>
            <p className="text-body text-text-secondary mb-4">The selected plan is not available.</p>
            <Btn variant="primary" onClick={() => onNav("plans")}>Back to plans</Btn>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-tertiary font-body flex flex-col">
      <MinimalHeader onBack={() => onNav("plans")} />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[28rem]">
          <CheckoutForm plan={plan} />

          <p className="text-center text-xs text-text-tertiary mt-5">
            Billed monthly · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
