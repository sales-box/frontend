import { describe, expect, it } from "vitest";
import { metric, statsView } from "./platformStats";
import type { PlatformStats } from "../platform-client";

/** The payload a server that predates `usage`/`billing`/`trend` returns. */
const OLD_PAYLOAD = {
  total: 48,
  byStatus: {
    pending: 1,
    active: 41,
    suspended: 5,
    abandoned: 0,
    offboarded: 1,
  },
  byTier: { 1: 30, 2: 16, 3: 2 },
  newThisWeek: 6,
} as unknown as PlatformStats;

const FULL_PAYLOAD: PlatformStats = {
  ...OLD_PAYLOAD,
  usage: { seats: 12, documents: 34, emailsAnalysed: 560 },
  billing: { none: 7, active: 2, past_due: 1, canceled: 0 },
  trend: [{ date: "2026-08-27", signups: 3, emailsAnalysed: 17 }],
};

describe("statsView", () => {
  it("survives a server that predates usage, billing and trend", () => {
    // The regression: the console read `billing.active` off a payload with no
    // `billing` and took the whole page down with a TypeError.
    expect(() => statsView(OLD_PAYLOAD)).not.toThrow();

    const v = statsView(OLD_PAYLOAD);
    expect(v.billing).toBeNull();
    expect(v.paying).toBeNull();
    expect(v.seats).toBeNull();
    expect(v.trend).toBeNull();
  });

  it("still reads the fields that old server does send", () => {
    const v = statsView(OLD_PAYLOAD);
    expect(v.total).toBe(48);
    expect(v.active).toBe(41);
    expect(v.suspended).toBe(5);
    expect(v.newThisWeek).toBe(6);
  });

  it("reads every section from a current server", () => {
    const v = statsView(FULL_PAYLOAD);
    expect(v.paying).toBe(2);
    expect(v.seats).toBe(12);
    expect(v.documents).toBe(34);
    expect(v.emailsAnalysed).toBe(560);
    expect(v.billing).toEqual({ none: 7, active: 2, past_due: 1, canceled: 0 });
    expect(v.trend).toHaveLength(1);
  });

  it("reports nothing at all when there is no payload yet", () => {
    const v = statsView(undefined);
    expect(v.total).toBeNull();
    expect(v.billing).toBeNull();
    expect(v.trend).toBeNull();
  });

  it("treats a missing bucket inside a present section as a real zero", () => {
    // The server zero-fills every bucket, so absence here means none — unlike
    // a missing SECTION, which means the server never reported it.
    const partial = {
      ...FULL_PAYLOAD,
      billing: { active: 2 },
    } as unknown as PlatformStats;

    expect(statsView(partial).billing).toEqual({
      active: 2,
      past_due: 0,
      canceled: 0,
      none: 0,
    });
  });

  it("refuses a trend that is not an array rather than handing it to a chart", () => {
    const broken = { ...FULL_PAYLOAD, trend: null } as unknown as PlatformStats;
    expect(statsView(broken).trend).toBeNull();
  });

  it("treats a non-numeric count as unavailable, not as zero", () => {
    const broken = { ...FULL_PAYLOAD, total: "48" } as unknown as PlatformStats;
    expect(statsView(broken).total).toBeNull();
  });
});

describe("metric", () => {
  it("renders an unavailable number as a dash, never as zero", () => {
    expect(metric(null)).toBe("—");
  });

  it("renders a real zero as zero", () => {
    expect(metric(0)).toBe("0");
  });

  it("groups thousands so a big number stays readable", () => {
    expect(metric(12345)).toBe((12345).toLocaleString());
  });
});
