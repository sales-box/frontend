import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Check, Shield, CreditCard, Lock } from "lucide-react";
import { MinimalHeader } from "../components/MinimalHeader";
import { useQueryClient } from "@tanstack/react-query";
import type { Screen } from "../types";
import { payments } from "../api-client";
import { isLoggedIn } from "../api-client";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";
import { PRICING_TIERS, type PricingTier } from "../data/pricingTiers";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

const CARD_STYLE = {
  base: {
    fontSize: "14px",
    fontFamily: "var(--font-body, system-ui, sans-serif)",
    color: "var(--color-text-primary, #1a1a2e)",
    "::placeholder": { color: "var(--color-text-tertiary, #9ca3af)" },
  },
  invalid: { color: "var(--color-danger, #ef4444)" },
};

function CheckoutForm({ plan, onNav }: { plan: PricingTier; onNav: (s: Screen) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const qc = useQueryClient();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    payments.createIntent(plan.priceCents ?? 0, plan.tier)
      .then(pi => { setClientSecret(pi.client_secret); setLoading(false); })
      .catch(() => { setError("Could not initialize payment. Please try again."); setLoading(false); });
  }, [plan.priceCents, plan.tier]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setPaying(true);
    setError("");

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      setDone(true);
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["tenant"] });
        onNav("overview");
      }, 2500);
    } else {
      setError("Payment was not completed. Please try again.");
      setPaying(false);
    }
  }

  if (done) {
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

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-heading text-text-primary mb-1">Complete your subscription</h2>
        <p className="text-body text-text-secondary">Enter your card details to activate your plan.</p>
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-2">Card details</label>
          <div className="border border-border rounded-md px-3.5 py-3 bg-surface focus-within:border-border-focus focus-within:ring-2 focus-within:ring-primary/25 transition-colors">
            {loading ? (
              <div className="text-sm text-text-tertiary">Loading…</div>
            ) : (
              <CardElement options={{ style: CARD_STYLE, hidePostalCode: true }} />
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-text-tertiary">
              <span className="text-[10px] font-semibold tracking-wide">We accept</span>
              <CreditCard size={16} strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
              <Lock size={11} strokeWidth={1.5} /> 256-bit encrypted
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-danger text-center">{error}</p>}

        <Btn type="submit" variant="gradient" size="lg" className="w-full" loading={paying} disabled={paying || loading || !stripe}>
          {paying ? "Processing…" : `Subscribe — ${plan.priceLabel}${plan.period}`}
        </Btn>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-tertiary">
          <Shield size={12} strokeWidth={1.5} />
          <span>Secure payment powered by Stripe</span>
        </div>
      </form>
    </Card>
  );
}

export function Checkout({ onNav }: { onNav: (s: Screen) => void }) {
  const [params] = useSearchParams();
  const planKey = params.get("plan") ?? "Growth";
  const plan = PRICING_TIERS.find(t => t.name === planKey);

  useEffect(() => {
    if (!isLoggedIn()) window.location.replace("/signin");
  }, []);

  if (!plan) {
    return (
      <div className="min-h-[100dvh] bg-surface-tertiary font-body flex flex-col">
        <MinimalHeader onBack={() => onNav("landing")} />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <Card className="w-full max-w-[28rem] p-6 sm:p-8 text-center">
            <h1 className="text-heading text-text-primary mb-2">Invalid plan</h1>
            <p className="text-body text-text-secondary mb-4">The selected plan is not available.</p>
            <Btn variant="primary" onClick={() => onNav("landing")}>Back to plans</Btn>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-tertiary font-body flex flex-col">
      <MinimalHeader onBack={() => onNav("landing")} />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[28rem]">
          <Elements stripe={stripePromise} options={{ locale: "en" }}>
          <CheckoutForm plan={plan} onNav={onNav} />
        </Elements>

        <p className="text-center text-xs text-text-tertiary mt-5">
          Billed monthly · Cancel anytime
        </p>
        </div>
      </div>
    </div>
  );
}
