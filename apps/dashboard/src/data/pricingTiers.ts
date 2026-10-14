/**
 * THE source of truth for what each plan costs and includes.
 *
 * This used to be duplicated in four places — routes/Landing.tsx,
 * routes/dashboard/Settings.tsx, routes/dashboard/Analytics.tsx and
 * lib/platformFormat.ts — which had already drifted: Enterprise was
 * "Unlimited seats" here and in Settings, but "Up to 50 Sales Engineers"
 * on the landing page, and this file promised SSO/SAML, a dedicated CSM
 * and an SLA that the landing page explicitly did not.
 *
 * Add a plan, change a price, or reword a feature HERE and nowhere else.
 */
export interface PricingTier {
  name: string;
  tier: number;
  priceCents: number | null;   // null for "Custom" (Enterprise)
  priceLabel: string;
  period: string;
  /** Display copy. `seatCap`/`docCap` are the numbers the UI enforces. */
  seats: string;
  docs: string;
  seatCap: number;
  /** null = no document limit. */
  docCap: number | null;
  features: string[];
  highlight: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter", tier: 1, priceCents: 4900, priceLabel: "$49", period: "/mo",
    seats: "Up to 3 Sales Engineers", docs: "25 documents", seatCap: 3, docCap: 25,
    features: ["AI reply suggestions", "Knowledge Base upload", "Basic analytics"],
    highlight: false,
  },
  {
    name: "Growth", tier: 2, priceCents: 14900, priceLabel: "$149", period: "/mo",
    seats: "Up to 10 Sales Engineers", docs: "200 documents", seatCap: 10, docCap: 200,
    features: ["Everything in Starter", "CRM integration", "Advanced analytics", "Priority support"],
    highlight: true,
  },
  {
    // Kept in step with routes/Landing.tsx, which deliberately does not
    // promise SSO/SAML, a dedicated CSM or an SLA — none of the three are
    // built. Seats match the cap Team.tsx actually enforces.
    name: "Enterprise", tier: 3, priceCents: null, priceLabel: "Custom", period: "",
    seats: "Up to 50 Sales Engineers", docs: "Unlimited documents", seatCap: 50, docCap: null,
    features: ["Everything in Growth", "Volume pricing", "Onboarding support"],
    highlight: false,
  },
];

/** Tier number → plan name. Used by Analytics, Settings and the operator console. */
export const TIER_NAMES: Record<number, string> = Object.fromEntries(
  PRICING_TIERS.map(t => [t.tier, t.name]),
);

export function tierName(tier: number): string {
  return TIER_NAMES[tier] ?? `Tier ${tier}`;
}

/** One-line summary of a plan: "$149/mo · Up to 10 Sales Engineers · 200 documents". */
export function tierBlurb(tier: number): string {
  const t = PRICING_TIERS.find(p => p.tier === tier);
  if (!t) return "";
  return [`${t.priceLabel}${t.period}`, t.seats, t.docs].join(" · ");
}

/** Seats a tier allows. Falls back to the smallest plan, never to unlimited. */
export function seatCap(tier: number | undefined): number {
  return PRICING_TIERS.find(p => p.tier === tier)?.seatCap ?? PRICING_TIERS[0].seatCap;
}

/** Documents a tier allows; null means unlimited. */
export function docCap(tier: number | undefined): number | null {
  const t = PRICING_TIERS.find(p => p.tier === tier);
  return t ? t.docCap : PRICING_TIERS[0].docCap;
}
