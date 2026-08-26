import { describe, it, expect } from "vitest";
import { parseEmails } from "./parseEmails";

describe("parseEmails", () => {
  it("reads a one-per-line paste", () => {
    const r = parseEmails("ali@acme.com\nsara@acme.com\n");
    expect(r.valid).toEqual(["ali@acme.com", "sara@acme.com"]);
    expect(r.invalid).toEqual([]);
  });

  it("reads a comma or semicolon separated paste", () => {
    expect(parseEmails("a@x.com, b@x.com; c@x.com").valid).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
    ]);
  });

  it("reads a CSV with a header row and a name column", () => {
    // The header words and the names carry no "@", so they are skipped rather
    // than reported as fifty errors.
    const csv = ["name,email,role", "Ali Hassan,ali@acme.com,SE", "Sara Nabil,sara@acme.com,SE"].join("\n");
    const r = parseEmails(csv);
    expect(r.valid).toEqual(["ali@acme.com", "sara@acme.com"]);
    expect(r.invalid).toEqual([]);
  });

  it("reads a CSV whose columns are in a different order", () => {
    const csv = ["Work Email,Full Name", "omar@acme.com,Omar Adel"].join("\n");
    expect(parseEmails(csv).valid).toEqual(["omar@acme.com"]);
  });

  it("unwraps Outlook-style display names and quoted fields", () => {
    const r = parseEmails('Ali Hassan <ali@acme.com>, "sara@acme.com"');
    expect(r.valid).toEqual(["ali@acme.com", "sara@acme.com"]);
  });

  it("drops trailing sentence punctuation", () => {
    expect(parseEmails("write to ali@acme.com.").valid).toEqual(["ali@acme.com"]);
  });

  it("lowercases and de-duplicates, keeping first-seen order", () => {
    const r = parseEmails("B@x.com\na@x.com\nb@X.COM\nA@x.com");
    expect(r.valid).toEqual(["b@x.com", "a@x.com"]);
    expect(r.duplicates).toBe(2);
  });

  it("reports a malformed address but keeps the good ones", () => {
    const r = parseEmails("good@x.com\nbroken@\nno-tld@acme\nfine@y.org");
    expect(r.valid).toEqual(["good@x.com", "fine@y.org"]);
    expect(r.invalid).toEqual(["broken@", "no-tld@acme"]);
  });

  it("ignores tokens with no @ instead of calling them invalid", () => {
    // A name column must never look like an error.
    const r = parseEmails("Ali\nSara\n0123456789\nreal@x.com");
    expect(r.valid).toEqual(["real@x.com"]);
    expect(r.invalid).toEqual([]);
  });

  it("rejects an address containing a colon", () => {
    // RFC 5322 reads "name: addr;" as an address group and nodemailer honours
    // it, so this would be shown as accepted while the invite went to
    // test@x.test — a different mailbox.
    const r = parseEmails("colon:test@x.test\nfine@x.test");
    expect(r.valid).toEqual(["fine@x.test"]);
    expect(r.invalid).toEqual(["colon:test@x.test"]);
  });

  it("rejects an address past the RFC 5321 length limit", () => {
    const tooLong = `${"x".repeat(300)}@acme.com`;
    const r = parseEmails(`${tooLong}\nok@acme.com`);
    expect(r.valid).toEqual(["ok@acme.com"]);
    expect(r.invalid).toEqual([tooLong]);
  });

  it("accepts an address exactly at the length limit", () => {
    const exact = `${"x".repeat(245)}@acme.com`;
    expect(exact).toHaveLength(254);
    expect(parseEmails(exact).valid).toEqual([exact]);
  });

  it("handles empty and whitespace-only input", () => {
    expect(parseEmails("").valid).toEqual([]);
    expect(parseEmails("   \n\t  ").valid).toEqual([]);
  });

  it("stops at the cap and says so", () => {
    const many = Array.from({ length: 205 }, (_, i) => `u${i}@x.com`).join("\n");
    const r = parseEmails(many);
    expect(r.valid).toHaveLength(200);
    expect(r.truncated).toBe(true);
  });

  it("does not flag truncation when the list fits exactly", () => {
    const exact = Array.from({ length: 200 }, (_, i) => `u${i}@x.com`).join("\n");
    const r = parseEmails(exact);
    expect(r.valid).toHaveLength(200);
    expect(r.truncated).toBe(false);
  });

  it("counts a repeat as a duplicate, not against the cap", () => {
    const r = parseEmails("same@x.com\nsame@x.com\nother@x.com", 2);
    expect(r.valid).toEqual(["same@x.com", "other@x.com"]);
    expect(r.duplicates).toBe(1);
    expect(r.truncated).toBe(false);
  });
});
