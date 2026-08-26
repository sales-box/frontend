/**
 * Turns whatever the admin pasted — or whatever was in their CSV — into a clean
 * list of addresses.
 *
 * Deliberately NOT a CSV parser. Real exports differ in column order, header
 * wording, delimiter and quoting, so parsing them properly means guessing which
 * column holds the address and being wrong the first time someone's CRM exports
 * "Work Email" instead of "email". Scanning every token for the ones that look
 * like addresses handles a pasted block, a one-per-line list, a `name,email`
 * export and an Outlook-style `Ali Hassan <ali@acme.com>` with one code path.
 *
 * The rule that makes it safe: only a token CONTAINING "@" is treated as an
 * attempted address. Names, headers, phone numbers and ids are skipped in
 * silence — reporting them as invalid would bury one real typo under fifty
 * complaints about a name column.
 */

/**
 * Mirrors the server's EMAIL_RE. Both sides must agree or the UI lies.
 *
 * ':' is excluded because RFC 5322 reads "name: addr;" as an address GROUP and
 * nodemailer honours it — 'colon:test@x.test' would be shown as accepted here
 * while the invite actually went to 'test@x.test'.
 */
const EMAIL_RE = /^[^\s@,;:<>]+@[^\s@,;:<>]+\.[a-z]{2,}$/i;

/** RFC 5321 caps a forward path at 254 characters. */
const MAX_EMAIL_LENGTH = 254;

/** Matches the server's MAX_BULK_EMAILS. */
export const MAX_EMAILS = 200;

export interface ParsedEmails {
  /** Valid, lowercased, de-duplicated, in the order first seen. */
  valid: string[];
  /** Tokens that contained "@" but are not usable addresses, as typed. */
  invalid: string[];
  /** How many repeats were collapsed out of `valid`. */
  duplicates: number;
  /** True when the input held more than MAX_EMAILS valid addresses. */
  truncated: boolean;
}

/** Strips the punctuation that survives a copy-paste but is not part of an address. */
function clean(token: string): string {
  return token
    .replace(/^[<("'[]+/, "")
    .replace(/[>)"'\].,;:]+$/, "")
    .trim();
}

export function parseEmails(text: string, max: number = MAX_EMAILS): ParsedEmails {
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  let truncated = false;

  for (const rawToken of text.split(/[\s,;]+/)) {
    if (!rawToken) continue;
    const token = clean(rawToken);
    // No "@" means this was never meant to be an address — a name, a header,
    // an id. Skipping silently is the whole point (see the note above).
    if (!token.includes("@")) continue;

    if (token.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(token)) {
      // Echo it back exactly as typed so the admin can find the line.
      invalid.push(token);
      continue;
    }

    const email = token.toLowerCase();
    if (seen.has(email)) {
      duplicates++;
      continue;
    }
    if (valid.length >= max) {
      truncated = true;
      continue;
    }
    seen.add(email);
    valid.push(email);
  }

  return { valid, invalid, duplicates, truncated };
}
