import type {
  PlatformStats,
  SubscriptionStatus,
  TrendPoint,
} from "../platform-client";

/** The order the subscription breakdown is read in, best state first. */
export const BILLING_KEYS: SubscriptionStatus[] = [
  "active",
  "past_due",
  "canceled",
  "none",
];

/**
 * The overview's numbers, with `null` meaning "the server did not tell us"
 * rather than zero.
 */
export interface StatsView {
  total: number | null;
  active: number | null;
  suspended: number | null;
  newThisWeek: number | null;
  paying: number | null;
  seats: number | null;
  documents: number | null;
  emailsAnalysed: number | null;
  billing: Record<SubscriptionStatus, number> | null;
  trend: TrendPoint[] | null;
}

const EMPTY: StatsView = {
  total: null,
  active: null,
  suspended: null,
  newThisWeek: null,
  paying: null,
  seats: null,
  documents: null,
  emailsAnalysed: null,
  billing: null,
  trend: null,
};

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Normalises whatever `/platform/tenants/stats` actually returned into a shape
 * the overview can render without checking anything.
 *
 * This exists because the console and the API deploy separately. A build of
 * this page will sometimes run against a server older than itself, and reading
 * a nested field off a section that server never sent takes the whole console
 * down with a TypeError — which is exactly what happened when the operator
 * console shipped ahead of the backend that added `billing` and `usage`.
 *
 * So every section is treated as optional at runtime, whatever the type says,
 * and a section that is missing reads as "—" instead of a convincing zero. A
 * missing KEY inside a section that IS present is a real zero: the server
 * zero-fills every bucket, so absence there means none.
 */
export function statsView(data: PlatformStats | undefined): StatsView {
  if (!data) return EMPTY;

  // The declared type promises these are all present. It describes the CURRENT
  // server, not the one this build happens to be talking to.
  const raw = data as Partial<PlatformStats>;
  const byStatus = raw.byStatus as
    | Partial<PlatformStats["byStatus"]>
    | undefined;
  const usage = raw.usage as Partial<PlatformStats["usage"]> | undefined;
  const billingRaw = raw.billing as
    | Partial<Record<SubscriptionStatus, number>>
    | undefined;

  const billing = billingRaw
    ? (Object.fromEntries(
        BILLING_KEYS.map((k) => [k, num(billingRaw[k]) ?? 0]),
      ) as Record<SubscriptionStatus, number>)
    : null;

  return {
    total: num(raw.total),
    active: num(byStatus?.active),
    suspended: num(byStatus?.suspended),
    newThisWeek: num(raw.newThisWeek),
    paying: billing ? billing.active : null,
    seats: num(usage?.seats),
    documents: num(usage?.documents),
    emailsAnalysed: num(usage?.emailsAnalysed),
    billing,
    // A trend that is not an array would crash every chart downstream.
    trend: Array.isArray(raw.trend) ? raw.trend : null,
  };
}

/** A number for the UI. `null` is "not available", never "zero". */
export function metric(value: number | null): string {
  return value === null ? "—" : value.toLocaleString();
}
