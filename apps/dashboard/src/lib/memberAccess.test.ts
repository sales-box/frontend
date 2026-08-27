import { describe, expect, it } from "vitest";
import { memberAccess } from "./memberAccess";
import type { TenantMember } from "../platform-client";

function member(over: Partial<TenantMember> = {}): TenantMember {
  return {
    email: "se@acme.com",
    role: "se",
    seatStatus: "verified",
    accountStatus: "connected",
    connected: true,
    addedAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: "2026-02-01T00:00:00.000Z",
    ...over,
  };
}

describe("memberAccess", () => {
  it("reports a verified engineer with a live mailbox as active", () => {
    expect(memberAccess(member())).toEqual({ label: "Active", tone: "success" });
  });

  it("reports a granted seat that has connected as active", () => {
    expect(memberAccess(member({ seatStatus: "granted" })).label).toBe("Active");
  });

  it("distinguishes an invited engineer who never connected a mailbox", () => {
    const m = member({
      seatStatus: "granted",
      accountStatus: null,
      connected: false,
    });
    expect(memberAccess(m)).toEqual({ label: "Invited", tone: "warning" });
  });

  it("flags a mailbox left behind with no seat", () => {
    const m = member({ seatStatus: null });
    expect(memberAccess(m)).toEqual({ label: "No seat", tone: "warning" });
  });

  it("reports a revoked seat as revoked", () => {
    expect(memberAccess(member({ seatStatus: "revoked" })).label).toBe("Revoked");
  });

  it("reports a revoked mailbox as revoked even when the seat still looks fine", () => {
    // The one wrong answer that matters: this person cannot work, and saying
    // "Active" because the seat row is healthy would send an operator away.
    const m = member({ seatStatus: "verified", accountStatus: "revoked" });
    expect(memberAccess(m).label).toBe("Revoked");
  });

  it("reports revoked when both sides are revoked", () => {
    const m = member({ seatStatus: "revoked", accountStatus: "revoked" });
    expect(memberAccess(m).label).toBe("Revoked");
  });
});
