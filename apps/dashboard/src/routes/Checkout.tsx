import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Inbox, Check, Shield, CreditCard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Screen } from "../types";
import { payments } from "../api-client";
import { isLoggedIn } from "../api-client";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";

const PLANS: Record<string, { name: string; tier: number; price: number; priceLabel: string; period: string; seats: string; docs: string; features: string[] }> = {
  Starter: {
    name: "Starter", tier: 1, price: 4900, priceLabel: "$49", period: "/mo", seats: "Up to 3 Sales Engineers", docs: "25 documents",
    features: ["AI reply suggestions", "Knowledge Base upload", "Basic analytics"],
  },
  Growth: {
    name: "Growth", tier: 2, price: 14900, priceLabel: "$149", period: "/mo", seats: "Up to 10 Sales Engineers", docs: "200 documents",
    features: ["Everything in Starter", "CRM integration", "Advanced analytics", "Priority support"],
  },
};

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

function CheckoutForm({ plan, onNav }: { plan: (typeof PLANS)[string]; onNav: (s: Screen) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const qc = useQueryClient();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    payments.createIntent(plan.price, plan.tier)
      .then(pi => { setClientSecret(pi.client_secret); setLoading(false); })
      .catch(() => { setError("Could not initialize payment. Please try again."); setLoading(false); });
  }, [plan.price, plan.tier]);

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
          <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-primary" /> {plan.seats}</span>
          <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-secondary" /> {plan.docs}</span>
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
        </div>

        {error && <p className="text-xs text-danger text-center">{error}</p>}

        <Btn type="submit" variant="gradient" size="lg" className="w-full" loading={paying} disabled={paying || loading || !stripe}>
          {paying ? "Processing…" : `Pay ${plan.priceLabel}${plan.period}`}
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
  const plan = PLANS[planKey];

  useEffect(() => {
    if (!isLoggedIn()) window.location.replace("/signin");
  }, []);

  if (!plan) {
    return (
      <div className="min-h-[100dvh] bg-surface-tertiary flex items-center justify-center px-4 py-10 font-body">
        <Card className="w-full max-w-[28rem] p-6 sm:p-8 text-center">
          <h1 className="text-heading text-text-primary mb-2">Invalid plan</h1>
          <p className="text-body text-text-secondary mb-4">The selected plan is not available.</p>
          <Btn variant="primary" onClick={() => onNav("landing")}>Back to plans</Btn>
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

        <Elements stripe={stripePromise} options={{ locale: "en" }}>
          <CheckoutForm plan={plan} onNav={onNav} />
        </Elements>

        <p className="text-center text-xs text-text-tertiary mt-5">
          14-day free trial · Cancel anytime
        </p>
      </div>
    </div>
  );
}
