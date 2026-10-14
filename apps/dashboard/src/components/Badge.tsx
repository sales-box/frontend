import type { ReactNode } from "react";

/**
 * Four variants, and the rule for picking one is the AXIS the value sits on,
 * not how good the value feels:
 *
 *   success — a settled, healthy end state. Active, connected, resolved,
 *             verified. Nothing is being asked of the reader.
 *   warning — someone has to do something. Suspended, needs review,
 *             awaiting activation, degraded.
 *   danger  — something is broken or lost. Failed, offboarded, at risk.
 *   muted   — a category or a neutral lifecycle label. Classifications,
 *             intents, "New", "Pending", "Not connected". Carries no
 *             judgement at all.
 *
 * A value that is merely *different* is `muted`, not `warning`. A new client
 * and an unconnected CRM are not problems. Reserve colour for the cases where
 * colour is the message, or it stops meaning anything.
 *
 * One axis per badge. If a row needs to show both severity and urgency, those
 * are two separate signals — do not paint both red and expect the reader to
 * tell them apart.
 */
export type BadgeVariant = "success" | "warning" | "danger" | "muted";

export function Badge({ children, variant = "muted" }: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  const styles: Record<BadgeVariant, string> = {
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning",
    danger: "bg-danger-light text-danger",
    muted: "bg-surface-secondary text-text-tertiary",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-body font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
