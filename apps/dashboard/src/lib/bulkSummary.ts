import type { BulkGrantOutcome } from "../api-client";

/**
 * Turns a bulk-grant summary into the one line shown in the toast.
 *
 * Exists as a pure function because the toast used to read
 * "No new invites — every address was already on the team" for EVERY zero-invite
 * result. Paste two addresses with no seats left and it told the admin they were
 * already on the team — sending them to hunt for members who were never there.
 * Zero invites has four different causes and they need four different answers.
 */
export function summariseBulk(summary: Record<BulkGrantOutcome, number>): string {
  const { added, reactivated, duplicate, invalid, over_limit: overLimit } = summary;
  const invited = added + reactivated;
  const s = (n: number) => (n === 1 ? "" : "es");

  if (invited > 0) {
    // Lead with the good news, but still flag anything that needs an action.
    const sent = `${invited} invite${invited === 1 ? "" : "s"} sent`;
    if (overLimit > 0) return `${sent} — ${overLimit} more need${overLimit === 1 ? "s" : ""} a bigger plan`;
    if (invalid > 0) return `${sent} — ${invalid} address${s(invalid)} couldn't be read`;
    return sent;
  }

  // Nothing was invited. Say WHY, most actionable cause first.
  if (overLimit > 0) {
    return `No seats available — ${overLimit} address${s(overLimit)} need${overLimit === 1 ? "s" : ""} a bigger plan`;
  }
  if (invalid > 0 && duplicate === 0) {
    return `Nothing sent — ${invalid} address${s(invalid)} couldn't be read`;
  }
  if (invalid > 0) {
    return `Nothing sent — ${duplicate} already on the team, ${invalid} couldn't be read`;
  }
  if (duplicate > 0) {
    return "No new invites — everyone was already on your team";
  }
  return "Nothing to invite";
}
