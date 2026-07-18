export interface PricingTier {
  name: string;
  tier: number;
  priceCents: number | null;   // null for "Custom" (Enterprise)
  priceLabel: string;
  period: string;
  seats: string;
  docs: string;
  features: string[];
  highlight: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter", tier: 1, priceCents: 4900, priceLabel: "$49", period: "/mo",
    seats: "Up to 3 Sales Engineers", docs: "25 documents",
    features: ["AI reply suggestions", "Knowledge Base upload", "Basic analytics"],
    highlight: false,
  },
  {
    name: "Growth", tier: 2, priceCents: 14900, priceLabel: "$149", period: "/mo",
    seats: "Up to 10 Sales Engineers", docs: "200 documents",
    features: ["Everything in Starter", "CRM integration", "Advanced analytics", "Priority support"],
    highlight: true,
  },
  {
    name: "Enterprise", tier: 3, priceCents: null, priceLabel: "Custom", period: "",
    seats: "Unlimited seats", docs: "Unlimited documents",
    features: ["Everything in Growth", "SSO / SAML", "Dedicated CSM", "SLA guarantee"],
    highlight: false,
  },
];
