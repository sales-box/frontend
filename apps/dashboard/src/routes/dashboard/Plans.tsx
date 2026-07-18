import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import type { Screen } from "../../types";
import { useTenant } from "../../hooks/queries";
import { Shell } from "../../components/Shell";
import { Btn } from "../../components/Btn";
import { Badge } from "../../components/Badge";
import { PageHeader } from "../../components/PageHeader";
import { Reveal } from "../../components/Reveal";
import { PRICING_TIERS } from "../../data/pricingTiers";

export function Plans({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const navigate = useNavigate();
  const { data: tenant } = useTenant();
  const currentTier = tenant?.tier ?? 0;

  return (
    <Shell active="settings" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader
          title="Change plan"
          subtitle="Choose the plan that fits your team."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mt-2">
          {PRICING_TIERS.map((tier, i) => {
            const isFeatured = tier.highlight;
            const isCurrent = currentTier === tier.tier;

            return (
              <Reveal key={tier.name} delay={i * 120} className="h-full">
                <div
                  className={`group relative h-full rounded-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col ${
                    isFeatured
                      ? "p-[1.5px] bg-gradient-to-br from-primary via-secondary to-accent-cool shadow-glow-primary scale-100 md:scale-105 z-10"
                      : "p-[1px] bg-border hover:bg-gradient-to-br hover:from-primary/30 hover:to-secondary/30 shadow-1"
                  }`}
                >
                  <div
                    className={`h-full rounded-[15px] p-8 flex flex-col justify-between relative overflow-hidden ${
                      isFeatured
                        ? "bg-surface dark:bg-surface-tertiary"
                        : "bg-surface dark:bg-surface-secondary"
                    }`}
                  >
                    {isFeatured && (
                      <>
                        <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-primary/10 dark:bg-primary/20 blur-2xl pointer-events-none" />
                        <span className="absolute top-4 right-4 text-[10px] font-bold tracking-[0.08em] uppercase bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-full shadow-sm">
                          Most popular
                        </span>
                      </>
                    )}

                    <div className="flex-1 flex flex-col gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-display text-xs font-bold tracking-[0.08em] uppercase text-text-tertiary">
                            {tier.name}
                          </h3>
                          {isCurrent && <Badge variant="success">Current</Badge>}
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-display text-[3.25rem] font-bold leading-none text-text-primary tracking-tight">
                            {tier.priceLabel}
                          </span>
                          {tier.period && (
                            <span className="text-sm font-medium text-text-tertiary">
                              {tier.period}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs font-semibold leading-relaxed text-text-secondary border-y border-border py-4 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {tier.seats}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          {tier.docs}
                        </div>
                      </div>

                      <ul className="space-y-3 pt-1 flex-1">
                        {tier.features.map(f => (
                          <li key={f} className="flex items-start gap-2.5 text-[13px] leading-snug text-text-secondary">
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-success/10 dark:bg-success/20 flex items-center justify-center text-success mt-0.5">
                              <Check size={10} strokeWidth={3} />
                            </span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 pt-2">
                      {isCurrent ? (
                        <Btn variant="secondary" size="lg" className="w-full justify-center" disabled>
                          Current plan
                        </Btn>
                      ) : (
                        <Btn
                          variant={isFeatured ? "gradient" : "secondary"}
                          size="lg"
                          className="w-full justify-center"
                          onClick={() => {
                            if (tier.name === "Enterprise") {
                              /* FLAG FOR PRODUCT: check if sales@inboxsalescopilot.com is the correct email
                                 for contacting sales for the Enterprise tier. */
                              window.location.href = "mailto:sales@inboxsalescopilot.com";
                            } else {
                              navigate(`/checkout?plan=${encodeURIComponent(tier.name)}`);
                            }
                          }}
                        >
                          {tier.name === "Enterprise" ? "Contact sales" : "Upgrade"}
                        </Btn>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
