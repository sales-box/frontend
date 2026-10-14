import { describe, it, expect } from "vitest";
import { extractSpreadsheetText, NotASpreadsheetError } from "./spreadsheet";
import { parseEmails } from "./parseEmails";

/**
 * Two real .xlsx files, embedded rather than read from disk so the test needs
 * no Node APIs and runs in the same browser-shaped environment as the code.
 *
 * INLINE_STR stores each string in the cell. SHARED_STR uses sharedStrings.xml
 * with cells referencing entries by index — which is what Excel itself writes.
 * Reading only one of the two shapes would look fine here and then return
 * nothing at all for a genuine Excel export.
 */
const INLINE_STR = `
  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`;

const SHARED_STR = `
  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`;

function xlsx(b64: string): Blob {
  const bin = atob(b64.replace(/\s+/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes]);
}

const EXPECTED = [
  "hamada.loksha255@gmail.com",
  "shadanelbert@gmail.com",
  "salmayasser816@gmail.com",
];

describe("extractSpreadsheetText", () => {
  it("reads addresses from a workbook that uses inline strings", async () => {
    const text = await extractSpreadsheetText(xlsx(INLINE_STR));
    expect(parseEmails(text).valid).toEqual(EXPECTED);
  });

  it("reads addresses from a sharedStrings workbook — the shape Excel writes", async () => {
    const text = await extractSpreadsheetText(xlsx(SHARED_STR));
    expect(parseEmails(text).valid).toEqual(EXPECTED);
  });

  it("keeps adjacent cells apart instead of running them together", async () => {
    // Two cells must not come back as "a@x.comb@x.com" — one merged token that
    // matches nothing and loses both addresses.
    const text = await extractSpreadsheetText(xlsx(SHARED_STR));
    expect(text).not.toMatch(/gmail\.com[A-Za-z]/);
  });

  it("ignores the names and headers around the addresses", async () => {
    const text = await extractSpreadsheetText(xlsx(SHARED_STR));
    const r = parseEmails(text);
    expect(r.invalid).toEqual([]); // "Full Name", "Sales" etc. carry no "@"
  });

  it("rejects a plain text file", async () => {
    await expect(
      extractSpreadsheetText(new Blob(["just,a,csv\n"])),
    ).rejects.toBeInstanceOf(NotASpreadsheetError);
  });

  it("rejects a truncated archive rather than returning empty text", async () => {
    const bin = atob(SHARED_STR.replace(/\s+/g, ""));
    const bytes = new Uint8Array(40);
    for (let i = 0; i < 40; i++) bytes[i] = bin.charCodeAt(i);
    await expect(
      extractSpreadsheetText(new Blob([bytes])),
    ).rejects.toBeInstanceOf(NotASpreadsheetError);
  });
});
