import type { TenantMember } from "../platform-client";

export type AccessTone = "success" | "warning" | "muted";

export interface MemberAccess {
  label: string;
  tone: AccessTone;
}

/**
 * What a member can actually do right now, from the two rows that decide it:
 * their allowlist seat and their connected mailbox.
 *
 * The two can disagree, and the disagreements are the interesting cases — an
 * engineer invited but never connected, or a mailbox still attached after its
 * seat was revoked. Collapsing them into "Active / Inactive" would hide exactly
 * the rows an operator opens this page to find.
 *
 * Revoked wins over everything: if either side is revoked the person is out,
 * and reporting them as active because the other row still looks healthy would
 * be the one wrong answer that matters.
 */
export function memberAccess(m: TenantMember): MemberAccess {
  if (m.seatStatus === "revoked" || m.accountStatus === "revoked") {
    return { label: "Revoked", tone: "muted" };
  }
  // A mailbox with no seat behind it — the seat was deleted, or the account
  // predates the allowlist. It still holds live Google tokens.
  if (!m.seatStatus) return { label: "No seat", tone: "warning" };
  if (!m.connected) return { label: "Invited", tone: "warning" };
  return { label: "Active", tone: "success" };
}
