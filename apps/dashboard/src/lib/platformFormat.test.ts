import { describe, it, expect } from "vitest";
import { PlatformApiError } from "./platformError";
import {
  tierLabel,
  statusLabel,
  statusVariant,
  relativeTime,
  friendlyError,
} from "./platformFormat";

describe("tierLabel", () => {
  it("names the three real tiers", () => {
    expect(tierLabel(1)).toBe("Starter");
    expect(tierLabel(2)).toBe("Growth");
    expect(tierLabel(3)).toBe("Enterprise");
  });

  it("falls back rather than rendering nothing for an unknown tier", () => {
    expect(tierLabel(9)).toBe("Tier 9");
  });
});

describe("statusLabel", () => {
  it("capitalises the raw enum for display", () => {
    expect(statusLabel("active")).toBe("Active");
    expect(statusLabel("offboarded")).toBe("Offboarded");
  });
});

describe("statusVariant", () => {
  it("maps lifecycle states onto badge tones", () => {
    expect(statusVariant("active")).toBe("success");
    expect(statusVariant("suspended")).toBe("warning");
    expect(statusVariant("offboarded")).toBe("danger");
    expect(statusVariant("pending")).toBe("muted");
    expect(statusVariant("abandoned")).toBe("muted");
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-08-26T12:00:00Z");

  it("says Never for a missing timestamp", () => {
    expect(relativeTime(null, now)).toBe("Never");
    expect(relativeTime(undefined, now)).toBe("Never");
  });

  it("says Never for an unparseable timestamp", () => {
    expect(relativeTime("not-a-date", now)).toBe("Never");
  });

  it("collapses the last minute to Just now", () => {
    expect(relativeTime("2026-08-26T11:59:30Z", now)).toBe("Just now");
  });

  it("singularises one unit", () => {
    expect(relativeTime("2026-08-26T11:00:00Z", now)).toBe("1 hour ago");
    expect(relativeTime("2026-08-25T12:00:00Z", now)).toBe("1 day ago");
  });

  it("pluralises more than one unit", () => {
    expect(relativeTime("2026-08-26T09:00:00Z", now)).toBe("3 hours ago");
    expect(relativeTime("2026-08-23T12:00:00Z", now)).toBe("3 days ago");
  });

  it("switches to an absolute date beyond 30 days", () => {
    expect(relativeTime("2026-01-05T12:00:00Z", now)).toMatch(/2026/);
  });
});

describe("friendlyError", () => {
  it("passes through a server message that is already human", () => {
    const e = new PlatformApiError(409, "Cannot suspend a tenant that is 'suspended'");
    expect(friendlyError(e)).toBe("Cannot suspend a tenant that is 'suspended'");
  });

  it("explains a missing tenant", () => {
    expect(friendlyError(new PlatformApiError(404, "Not Found"))).toMatch(
      /no longer exists/i,
    );
  });

  it("does not leak a 500 body", () => {
    const e = new PlatformApiError(500, '{"stack":"at Object.<anonymous>"}');
    const msg = friendlyError(e);
    expect(msg).not.toContain("stack");
    expect(msg).toMatch(/our side/i);
  });

  it("names a network failure as a network failure", () => {
    expect(friendlyError(new TypeError("Failed to fetch"))).toMatch(
      /reach the server/i,
    );
  });

  it("never returns an empty string for an unknown throw", () => {
    expect(friendlyError({ weird: true }).length).toBeGreaterThan(0);
    expect(friendlyError(undefined).length).toBeGreaterThan(0);
  });
});
