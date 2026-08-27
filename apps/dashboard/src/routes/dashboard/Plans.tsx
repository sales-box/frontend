import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import type { Screen } from "../../types";
import { useTenant } from "../../hooks/queries";
import { Shell } from "../../components/Shell";
import { PageHeader } from "../../components/PageHeader";
import { Reveal } from "../../components/Reveal";
import { PRICING_TIERS } from "../../data/pricingTiers";

const ENTERPRISE_MAILTO =
  "mailto:admin-sales@salesbox.dev?subject=Enterprise%20plan%20enquiry";

export function Plans({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const navigate = useNavigate();
  const { data: tenant } = useTenant();
  const hasPaidSub = tenant?.subscriptionStatus === "active";
  const currentTier = hasPaidSub ? (tenant?.tier ?? 0) : 0;
  const current = PRICING_TIERS.find(t => t.tier === currentTier);

  return (
    <Shell active="settings" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
        <PageHeader
          title="Plans & Billing"
          subtitle={hasPaidSub && current ? `You're on the ${current.name} plan` : "Pick a plan to get started with SalesBox"}
        />

        {/* Current plan banner — Dark Teal, shown when subscribed */}
        {hasPaidSub && current && (
          <Reveal>
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl px-6 py-5 mb-6"
              style={{ backgroundColor: "var(--brand-teal)" }}
            >
              <div>
                <div className="text-lg font-semibold text-white">{current.name} Plan · {current.priceLabel}{current.period}</div>
                <div className="text-[14px] mt-1" style={{ color: "var(--brand-aqua)" }}>{current.seats} · {current.docs}</div>
              </div>
              <button
                onClick={() => navigate(`/checkout?plan=${encodeURIComponent(current.name)}`)}
                className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-[14px] font-semibold shrink-0 transition-opacity hover:opacity-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{ backgroundColor: "var(--brand-orange)", color: "var(--on-warm)" }}
              >
                Manage Billing
              </button>
            </div>
          </Reveal>
        )}

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PRICING_TIERS.map((tier, i) => {
            const isCurrent = hasPaidSub && currentTier === tier.tier;
            const isEnterprise = tier.name === "Enterprise";
            const isLower = hasPaidSub && tier.tier < currentTier;

            // Feature tick + text colours: light-on-dark for the current card,
            // cyan-on-grey for the rest.
            const tickColor = isCurrent ? "var(--brand-aqua)" : "var(--brand-cyan)";

            return (
              <Reveal key={tier.name} delay={i * 100} className="h-full">
                <div
                  className={`h-full rounded-2xl p-7 sm:p-8 flex flex-col gap-5 ${isCurrent ? "border-2" : "bg-surface border border-border"}`}
                  style={isCurrent ? { backgroundColor: "var(--on-warm)", borderColor: "var(--brand-orange)" } : undefined}
                >
                  {/* Name + current badge */}
                  <div className="flex items-center gap-2.5">
                    {isCurrent && (
                      <span
                        className="inline-flex items-center rounded px-2.5 py-1 text-[12px] font-semibold"
                        style={{ backgroundColor: "var(--brand-orange)", color: "var(--on-warm)" }}
                      >
                        Current Plan
                      </span>
                    )}
                    <span className={`text-xl font-semibold ${isCurrent ? "text-white" : "text-text-primary"}`}>{tier.name}</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-1">
                    <span
                      className="text-[40px] font-bold leading-none tracking-tight"
                      style={{ color: isCurrent ? "var(--brand-orange)" : undefined }}
                    >
                      <span className={isCurrent ? "" : "text-text-primary"}>{tier.priceLabel}</span>
                    </span>
                    {tier.period && (
                      <span className={`text-base pb-1 ${isCurrent ? "" : "text-text-tertiary"}`} style={{ color: isCurrent ? "var(--brand-aqua)" : undefined }}>
                        {tier.period}
                      </span>
                    )}
                  </div>

                  {/* Seats · docs */}
                  <div className={`text-[14px] font-medium ${isCurrent ? "" : "text-text-tertiary"}`} style={{ color: isCurrent ? "var(--brand-aqua)" : undefined }}>
                    {tier.seats} · {tier.docs}
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full" style={{ backgroundColor: isCurrent ? "var(--brand-teal)" : "var(--color-border)" }} />

                  {/* Features */}
                  <ul className="flex flex-col gap-3 flex-1">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-[14px]">
                        <Check size={14} strokeWidth={3} style={{ color: tickColor }} className="shrink-0" />
                        <span className={isCurrent ? "" : "text-text-tertiary"} style={{ color: isCurrent ? "var(--brand-aqua)" : undefined }}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action */}
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full rounded-lg py-3 text-[14px] font-semibold text-white cursor-default"
                      style={{ backgroundColor: "var(--brand-cyan)" }}
                    >
                      Current Plan
                    </button>
                  ) : isEnterprise ? (
                    <button
                      onClick={() => { window.location.href = ENTERPRISE_MAILTO; }}
                      className="w-full rounded-lg py-3 text-[14px] font-semibold transition-opacity hover:opacity-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      style={{ backgroundColor: "var(--brand-orange)", color: "var(--on-warm)" }}
                    >
                      Contact Sales
                    </button>
                  ) : isLower ? (
                    <button
                      onClick={() => navigate(`/checkout?plan=${encodeURIComponent(tier.name)}`)}
                      className="w-full rounded-lg py-3 text-[14px] font-semibold bg-surface-tertiary text-text-tertiary transition-colors hover:bg-border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      Downgrade
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/checkout?plan=${encodeURIComponent(tier.name)}`)}
                      className="w-full rounded-lg py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      style={{ backgroundColor: "var(--brand-cyan)" }}
                    >
                      {hasPaidSub ? "Upgrade" : "Subscribe"}
                    </button>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
