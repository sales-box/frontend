import type { TenantStatus } from "../platform-client";
import { PlatformApiError } from "./platformError";

/** Mirrors `data/pricingTiers.ts` — a tier number is never shown bare. */
export const TIER_NAMES: Record<number, string> = {
  1: "Starter",
  2: "Growth",
  3: "Enterprise",
};

export function tierLabel(tier: number): string {
  return TIER_NAMES[tier] ?? `Tier ${tier}`;
}

const STATUS_LABELS: Record<TenantStatus, string> = {
  pending: "Pending",
  active: "Active",
  suspended: "Suspended",
  abandoned: "Abandoned",
  offboarded: "Offboarded",
};

export function statusLabel(status: TenantStatus): string {
  return STATUS_LABELS[status] ?? status;
}

type BadgeVariant = "success" | "warning" | "danger" | "muted";

const STATUS_VARIANTS: Record<TenantStatus, BadgeVariant> = {
  active: "success",
  suspended: "warning",
  offboarded: "danger",
  pending: "muted",
  abandoned: "muted",
};

export function statusVariant(status: TenantStatus): BadgeVariant {
  return STATUS_VARIANTS[status] ?? "muted";
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}

/**
 * A human interval. `now` is injectable so the behaviour is testable without
 * freezing the clock.
 */
export function relativeTime(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Never";

  const diff = now.getTime() - then;
  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return plural(Math.floor(diff / MINUTE), "minute");
  if (diff < DAY) return plural(Math.floor(diff / HOUR), "hour");
  if (diff < 30 * DAY) return plural(Math.floor(diff / DAY), "day");

  return new Date(then).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Turns anything thrown by the API layer into a sentence an operator can act
 * on. Nothing else may reach the DOM — a stringified exception is both
 * useless to the reader and a way to leak internals.
 *
 * @param notFound - Replaces the default 404 sentence. Pass one whenever the
 *   request was not about a tenant's existence, so a missing member does not
 *   report the whole workspace as gone.
 */
export function friendlyError(e: unknown, notFound?: string): string {
  if (e instanceof PlatformApiError) {
    // 400/409 come from our own validators and transition guard, and are
    // already written for a human ("Cannot suspend a tenant that is …").
    if (e.status === 400 || e.status === 409) {
      return e.message || "That request wasn't valid.";
    }
    if (e.status === 401) return "Your operator session expired. Sign in again.";
    if (e.status === 403) return "Your operator account isn't allowed to do that.";
    if (e.status === 404) {
      // The caller knows what it asked for; "that tenant is gone" is actively
      // misleading when the request was about one member of a live tenant.
      return (
        notFound ?? "That tenant no longer exists — it may have just been removed."
      );
    }
    if (e.status >= 500) {
      return "Something went wrong on our side. Try again in a moment.";
    }
    return e.message || "Something went wrong. Try again.";
  }
  // fetch() rejects with a TypeError when the network itself fails.
  if (e instanceof TypeError) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return "Something went wrong. Try again.";
}
