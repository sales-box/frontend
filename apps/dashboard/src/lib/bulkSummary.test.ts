import { describe, it, expect } from "vitest";
import { summariseBulk } from "./bulkSummary";
import type { BulkGrantOutcome } from "../api-client";

const s = (p: Partial<Record<BulkGrantOutcome, number>>): Record<BulkGrantOutcome, number> => ({
  added: 0, reactivated: 0, duplicate: 0, invalid: 0, over_limit: 0, ...p,
});

describe("summariseBulk", () => {
  it("reports how many invites went out", () => {
    expect(summariseBulk(s({ added: 3 }))).toBe("3 invites sent");
    expect(summariseBulk(s({ added: 1 }))).toBe("1 invite sent");
  });

  it("counts reactivations as invites too", () => {
    expect(summariseBulk(s({ added: 1, reactivated: 2 }))).toBe("3 invites sent");
  });

  it("does NOT blame duplicates when the seats ran out", () => {
    // The bug: two brand-new addresses with no seats left were reported as
    // "every address was already on the team", sending the admin to look for
    // members who were never there.
    expect(summariseBulk(s({ over_limit: 2 }))).toBe(
      "No seats available — 2 addresses need a bigger plan",
    );
    expect(summariseBulk(s({ over_limit: 1 }))).toBe(
      "No seats available — 1 address needs a bigger plan",
    );
  });

  it("does not blame duplicates when the rows were unreadable", () => {
    expect(summariseBulk(s({ invalid: 2 }))).toBe("Nothing sent — 2 addresses couldn't be read");
  });

  it("names both causes when the list was mixed", () => {
    expect(summariseBulk(s({ duplicate: 3, invalid: 2 }))).toBe(
      "Nothing sent — 3 already on the team, 2 couldn't be read",
    );
  });

  it("says everyone was already on the team only when that is true", () => {
    expect(summariseBulk(s({ duplicate: 4 }))).toBe("No new invites — everyone was already on your team");
  });

  it("flags the overflow even when some invites did go out", () => {
    expect(summariseBulk(s({ added: 2, over_limit: 3 }))).toBe(
      "2 invites sent — 3 more need a bigger plan",
    );
  });

  it("flags unreadable rows even when some invites did go out", () => {
    expect(summariseBulk(s({ added: 2, invalid: 1 }))).toBe(
      "2 invites sent — 1 address couldn't be read",
    );
  });

  it("handles an all-zero summary without claiming anything", () => {
    expect(summariseBulk(s({}))).toBe("Nothing to invite");
  });
});
