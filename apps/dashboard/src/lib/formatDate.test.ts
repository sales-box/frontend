import { describe, expect, it } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("turns an ISO timestamp into something readable", () => {
    const out = formatDate("2026-08-28T09:21:33.421Z");
    expect(out).not.toContain("T");
    expect(out).not.toContain("Z");
    expect(out).toMatch(/\d/);
  });

  // Better to show whatever the server sent than the words "Invalid Date".
  it.each(["", "just now", "not a date"])("returns %p unchanged", (raw) => {
    expect(formatDate(raw)).toBe(raw);
  });
});
