import { useMemo, useRef, useState } from "react";
import { Plus, AlertTriangle, Clock, Users, UserX, Shield, Upload, CheckCircle2 } from "lucide-react";
import type { Screen } from "../../types";
import { useTeamStats, useGrantAccess, useGrantAccessBulk, useRevokeAccess, useTenant } from "../../hooks/queries";
import { parseEmails, MAX_EMAILS } from "../../lib/parseEmails";
import { extractSpreadsheetText, NotASpreadsheetError } from "../../lib/spreadsheet";
import { summariseBulk } from "../../lib/bulkSummary";
import type { BulkGrantOutcome, BulkGrantResult } from "../../api-client";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Btn } from "../../components/Btn";
import { FormInput } from "../../components/FormInput";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { Reveal } from "../../components/Reveal";
import { useToast } from "../../components/Toast";
import { seatCap, TIER_NAMES } from "../../data/pricingTiers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40";

// Membership status → Figma-tinted pill. Brand vars so the text mutes in
// dark mode; the 0.12 tint stays subtle in both themes.
function statusBadge(status: string) {
  const b = status === "verified"
    ? { label: "Active", bg: "rgba(10, 147, 150, 0.12)", fg: "var(--brand-cyan)" }
    : status === "granted"
      ? { label: "Invited", bg: "rgba(238, 155, 0, 0.12)", fg: "var(--brand-orange)" }
      : { label: "Revoked", bg: "rgba(155, 34, 38, 0.12)", fg: "var(--brand-iron)" };
  return (
    <span className="inline-flex items-center rounded px-2.5 py-1 text-[12px] font-medium" style={{ backgroundColor: b.bg, color: b.fg }}>
      {b.label}
    </span>
  );
}

/** How each per-row outcome is described back to the admin. */
const OUTCOME_LABEL: Record<BulkGrantOutcome, string> = {
  added: "Invited",
  reactivated: "Access restored",
  duplicate: "Already on the team",
  invalid: "Not a valid email",
  over_limit: "No seat available",
};
const OUTCOME_TONE: Record<BulkGrantOutcome, string> = {
  added: "text-success",
  reactivated: "text-success",
  duplicate: "text-text-tertiary",
  invalid: "text-danger",
  over_limit: "text-warning",
};

export function Team({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [mode, setMode] = useState<"single" | "many">("single");
  const [bulkText, setBulkText] = useState("");
  const [bulkReport, setBulkReport] = useState<BulkGrantResult | null>(null);
  const [bulkError, setBulkError] = useState("");
  const [fileNote, setFileNote] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: tenant } = useTenant();
  const { data: rawMembers, isLoading: loading, error } = useTeamStats();
  const grantAccess = useGrantAccess();
  const grantBulk = useGrantAccessBulk();
  const revokeAccess = useRevokeAccess();

  // Revoked members are LISTED (an admin needs to see who used to have access,
  // and be able to give it back) but never COUNTED — they hold no seat, they
  // have not "logged in at least once" for the purposes of the Verified card,
  // and they are not awaiting activation. Sorted last so the working team reads
  // first. Every count below therefore uses activeMembers, not members.
  const members = (rawMembers ?? []).map(m => ({
    email: m.email,
    initials: m.email.substring(0, 2).toUpperCase(),
    role: "Sales Engineer",
    status: m.status,
    grantedAt: m.grantedAt,
    lastLoginAt: m.lastLoginAt,
    repliesSent: m.repliesSent,
    emailsReceived: m.emailsReceived,
    replyRate: m.replyRate,
  })).sort((a, b) => Number(a.status === "revoked") - Number(b.status === "revoked"));

  const activeMembers = members.filter(m => m.status !== "revoked");
  const sending = grantAccess.isPending;

  const total = seatCap(tenant?.tier);
  const used = activeMembers.length;
  const atLimit = used >= total;
  const planName = tenant?.tier != null ? TIER_NAMES[tenant.tier] : undefined;
  const emailError = !newEmail.trim() ? "Email is required" : !EMAIL_RE.test(newEmail) ? "Enter a valid email" : "";

  // Parsed live so the admin sees what will be sent BEFORE committing — the
  // seat maths in particular, since going over the cap is the common surprise.
  const parsed = useMemo(() => parseEmails(bulkText), [bulkText]);
  const seatsFree = Math.max(0, total - used);
  const willNotFit = Math.max(0, parsed.valid.length - seatsFree);
  const bulkSending = grantBulk.isPending;

  const closeModal = () => {
    setShowModal(false);
    setNewEmail("");
    setEmailTouched(false);
    setBulkText("");
    setBulkReport(null);
    setBulkError("");
    setFileNote("");
    setMode("single");
  };

  const readFile = async (file: File) => {
    setBulkError("");
    setFileNote("");
    // Reset the input at every exit so picking the SAME file again still fires
    // a change event.
    const done = () => { if (fileInput.current) fileInput.current.value = ""; };

    // Guard against someone picking a 200 MB file by mistake; the cap is 200
    // addresses, so anything this large is not an address list.
    if (file.size > 2_000_000) {
      setBulkError("That file is too large. Export just the email column, or paste the addresses.");
      done();
      return;
    }

    let text: string;
    try {
      // Sniff the magic bytes rather than trusting the extension — a .csv that
      // is really a workbook would otherwise be decoded as binary noise.
      const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      const isZipContainer = head[0] === 0x50 && head[1] === 0x4b; // PK — xlsx, ods
      const isLegacyXls = head[0] === 0xd0 && head[1] === 0xcf; // OLE2 — .xls

      if (isLegacyXls) {
        // The old binary format predates the zip container and would need a
        // real parser. Saying so beats failing silently.
        setBulkError("That's an old .xls file. Save it as .xlsx or .csv and upload again.");
        done();
        return;
      }

      if (isZipContainer) {
        text = await extractSpreadsheetText(file);
      } else {
        text = await file.text();
        if (text.includes("\u0000")) {
          setBulkError("That file isn't plain text. Upload a CSV or an Excel file.");
          done();
          return;
        }
      }
    } catch (err) {
      setBulkError(
        err instanceof NotASpreadsheetError
          ? "Couldn't read that spreadsheet. Try saving it as CSV and uploading again."
          : "Could not read that file. Try pasting the addresses instead.",
      );
      done();
      return;
    }

    // Show ONLY the addresses, never the raw file. A pasted CSV dumped names,
    // departments and header rows into the box, which buried what was actually
    // going to be sent. Invalid tokens are kept so the preview can still report
    // them — they are addresses that failed, not spreadsheet furniture.
    const found = parseEmails(text);
    const addresses = [...found.valid, ...found.invalid];

    if (addresses.length === 0) {
      setBulkError(`No email addresses found in ${file.name}.`);
      done();
      return;
    }

    // Append rather than replace, so picking a second file adds to the list.
    setBulkText(prev =>
      prev.trim() ? `${prev.trim()}\n${addresses.join("\n")}` : addresses.join("\n"),
    );
    setFileNote(
      `${file.name} — ${found.valid.length} address${found.valid.length === 1 ? "" : "es"} found`,
    );
    done();
  };

  const sendBulk = async () => {
    if (bulkSending || parsed.valid.length === 0) return;
    setBulkError("");
    try {
      const report = await grantBulk.mutateAsync(parsed.valid);
      setBulkReport(report);
      toast(summariseBulk(report.summary));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setBulkError(msg || "Could not add those addresses. Please try again.");
    }
  };

  const sendInvite = async () => {
    setEmailTouched(true);
    if (emailError || sending) return;
    try {
      const { outcome } = await grantAccess.mutateAsync(newEmail);
      // "Invite sent" used to be printed unconditionally, including when the
      // address was already on the team and no mail had been sent at all.
      toast(
        outcome === "duplicate"
          ? `${newEmail} is already on your team`
          : outcome === "reactivated"
            ? `Access restored for ${newEmail}`
            : `Invite sent to ${newEmail}`,
      );
      closeModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.startsWith("403")) {
        toast("Seat limit reached — upgrade your plan to add more Sales Engineers");
      } else {
        toast("Failed to send invite — please try again");
      }
    }
  };

  /**
   * Gives a revoked engineer their access back. Reuses the single-grant route:
   * the server reactivates the existing row by id rather than inserting a
   * second one, and re-sends the extension invite, which they need again.
   */
  const restore = async (email: string) => {
    if (restoring) return;
    setRestoring(email);
    try {
      await grantAccess.mutateAsync(email);
      toast(`Access restored for ${email}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast(
        msg.startsWith("403")
          ? "Seat limit reached — upgrade your plan to restore this engineer"
          : "Could not restore access — please try again",
      );
    } finally {
      setRestoring(null);
    }
  };

  const revoke = async (email: string) => {
    setConfirmRevoke(null);
    try {
      const { outcome } = await revokeAccess.mutateAsync(email);
      toast(
        outcome === "revoked"
          ? `Access revoked for ${email} — they've been emailed`
          : outcome === "already_revoked"
            ? `${email} had already been revoked`
            : `${email} isn't on your team`,
      );
    } catch {
      toast("Failed to revoke access — please try again");
    }
  };

  return (
    <Shell active="team" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
        <PageHeader
          title="Team"
          subtitle={`${used} of ${total} seats used${planName ? ` · ${planName} plan` : ""}`}
          actions={
            <button
              onClick={() => setShowModal(true)}
              disabled={atLimit}
              aria-label={atLimit ? "Invite Member — seat limit reached, upgrade tier" : "Invite Member"}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-semibold shrink-0 cursor-pointer bg-(--brand-orange) hover:bg-(--brand-caramel) text-(--on-warm) transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-(--brand-orange) ${focusRing}`}
            >
              <Plus size={16} strokeWidth={2.25} /> Invite Member
            </button>
          }
        />

        {/* Seat usage bar — Figma: thin card, orange progress */}
        <Reveal>
        <Card className="px-6 py-3.5 mb-5">
          <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (used / total) * 100)}%`, backgroundColor: "var(--brand-orange)" }}
            />
          </div>
        </Card>
        </Reveal>

        {atLimit && (
          <div className="flex items-center gap-3 bg-warning-light border border-warning/20 rounded-lg px-4 py-3 mb-5 text-[14px]" role="status">
            <AlertTriangle size={14} strokeWidth={1.5} className="text-warning shrink-0" />
            <span className="text-warning">You've used all {total} seats on your current plan.</span>
            <button onClick={() => onNav("plans")} className={`text-warning underline font-medium ml-auto cursor-pointer rounded-sm ${focusRing}`}>Upgrade tier</button>
          </div>
        )}

        {/* Summary cards — items-stretch + h-full keeps all three equal height */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 items-stretch">
          <Reveal className="h-full">
            <Card className="p-5 h-full">
              <div className="flex items-center gap-3 mb-3">
                <Users size={18} strokeWidth={1.5} className="text-text-tertiary" />
                <div className="text-[12px] text-text-tertiary">Total Members</div>
              </div>
              <div className="text-2xl font-display font-bold text-text-primary">{used}</div>
              <div className="text-[12px] text-text-tertiary mt-1">of {total} seats used</div>
              <div className="w-full h-2 rounded-full bg-surface-tertiary overflow-hidden mt-3">
                <div className={`h-full rounded-full transition-all duration-500 ${used / total >= 0.8 ? "bg-warning" : "bg-primary"}`} style={{ width: `${(used / total) * 100}%` }} />
              </div>
            </Card>
          </Reveal>

          <Reveal delay={70} className="h-full">
            <Card className="p-5 h-full">
              <div className="flex items-center gap-3 mb-3">
                <Shield size={18} strokeWidth={1.5} className="text-text-tertiary" />
                <div className="text-[12px] text-text-tertiary">Verified</div>
              </div>
              <div className="text-2xl font-display font-bold text-text-primary">
                {activeMembers.filter(m => m.lastLoginAt).length}
              </div>
              <div className="text-[12px] text-success mt-1">Logged in at least once</div>
            </Card>
          </Reveal>

          <Reveal delay={140} className="h-full">
            <Card className="p-5 h-full">
              <div className="flex items-center gap-3 mb-3">
                <Clock size={18} strokeWidth={1.5} className="text-text-tertiary" />
                <div className="text-[12px] text-text-tertiary">Pending</div>
              </div>
              <div className="text-2xl font-display font-bold text-text-primary">{activeMembers.filter(m => m.status === "granted").length}</div>
              <div className="text-[12px] text-warning mt-1">Awaiting activation</div>
            </Card>
          </Reveal>
        </div>

        {/* Members table */}
        <Reveal>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
              <Users size={18} strokeWidth={1.5} className="text-text-tertiary" />
              <h2 className="text-subheading text-text-primary">Members</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[46rem]">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary/50">
                    <th scope="col" className="text-eyebrow text-left px-5 py-2.5">Member</th>
                    <th scope="col" className="text-eyebrow text-left px-5 py-2.5 w-28">Status</th>
                    <th scope="col" className="text-eyebrow text-left px-5 py-2.5 w-32">Date added</th>
                    <th scope="col" className="text-eyebrow text-left px-5 py-2.5 w-28">Last active</th>
                    <th scope="col" className="text-eyebrow text-left px-5 py-2.5 w-32">Replies</th>
                    <th scope="col" className="px-5 py-2.5 w-28"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-[14px] text-text-tertiary">Loading team…</td></tr>
                  ) : error ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-[14px] text-danger">Failed to load team members.</td></tr>
                  ) : members.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-[14px] text-text-tertiary">No team members yet. Invite your first Sales Engineer above.</td></tr>
                  ) : members.map((m, i) => (
                    <tr key={m.email} className={`border-b border-border last:border-0 hover:bg-surface-secondary/30 transition-colors ${i % 2 === 1 ? "bg-surface-secondary/40" : ""} ${m.status === "revoked" ? "opacity-60" : ""}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-semibold shrink-0"
                            style={{ backgroundColor: "var(--brand-teal)" }}
                          >
                            {m.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[14px] font-medium text-text-primary truncate">{m.email}</div>
                            <div className="text-[12px] text-text-tertiary truncate">{m.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {statusBadge(m.status)}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-text-tertiary font-mono whitespace-nowrap">{m.grantedAt ? new Date(m.grantedAt).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3.5 text-[12px] text-text-tertiary font-mono whitespace-nowrap">{m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3.5 text-[12px] text-text-tertiary font-mono whitespace-nowrap">
                        {m.emailsReceived > 0 ? `${m.repliesSent}/${m.emailsReceived} (${Math.round(m.replyRate * 100)}%)` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {m.status === "revoked" ? (
                          <button
                            onClick={() => void restore(m.email)}
                            disabled={restoring === m.email || atLimit}
                            aria-label={`Restore access for ${m.email}`}
                            title={atLimit ? "No seat available — upgrade your plan" : undefined}
                            className={`text-[12px] font-medium text-secondary hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline rounded-sm ${focusRing}`}
                          >
                            {restoring === m.email ? "Restoring…" : "Restore"}
                          </button>
                        ) : confirmRevoke === m.email ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setConfirmRevoke(null)} className={`text-[12px] text-text-tertiary hover:text-text-primary cursor-pointer rounded-sm ${focusRing}`}>Cancel</button>
                            <button onClick={() => revoke(m.email)} className={`text-[12px] text-danger font-medium cursor-pointer rounded-sm ${focusRing}`}>Confirm</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRevoke(m.email)}
                            aria-label={`Revoke access for ${m.email}`}
                            className={`w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-tertiary hover:text-danger hover:border-danger/40 hover:bg-danger-light transition-colors cursor-pointer ${focusRing}`}
                          >
                            <UserX size={15} strokeWidth={1.5} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Reveal>
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={bulkReport ? "Invite results" : "Add Sales Engineers"}
        footer={
          bulkReport ? (
            <Btn variant="primary" size="sm" onClick={closeModal}>Done</Btn>
          ) : mode === "single" ? (
            <>
              <Btn variant="secondary" size="sm" onClick={closeModal}>Cancel</Btn>
              <Btn variant="primary" size="sm" loading={sending} onClick={sendInvite}>Send invite</Btn>
            </>
          ) : (
            <>
              <Btn variant="secondary" size="sm" onClick={closeModal}>Cancel</Btn>
              <Btn
                variant="primary" size="sm" loading={bulkSending}
                disabled={bulkSending || parsed.valid.length === 0}
                onClick={sendBulk}
              >
                {parsed.valid.length > 0 ? `Invite ${parsed.valid.length}` : "Invite"}
              </Btn>
            </>
          )
        }
      >
        {bulkReport ? (
          /* ---------- result report ---------- */
          <div>
            <p className="text-sm text-text-secondary mb-3">
              {bulkReport.summary.added + bulkReport.summary.reactivated} invited ·{" "}
              {bulkReport.seats.used}/{bulkReport.seats.limit} seats used
            </p>
            <div className="max-h-72 overflow-y-auto border border-border rounded-sm">
              <table className="w-full border-collapse">
                <tbody>
                  {bulkReport.results.map((r, i) => (
                    <tr key={`${r.email}-${i}`} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-[13px] text-text-primary truncate max-w-[16rem]">
                        {r.email || <span className="text-text-tertiary italic">(blank)</span>}
                      </td>
                      <td className={`px-3 py-2 text-xs text-right whitespace-nowrap ${OUTCOME_TONE[r.outcome]}`}>
                        {OUTCOME_LABEL[r.outcome]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            {/* ---------- mode switch ---------- */}
            <div role="tablist" aria-label="How to add engineers" className="flex gap-1 mb-4 p-1 bg-surface-secondary rounded-sm w-fit">
              {(["single", "many"] as const).map(m => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-sm cursor-pointer transition-colors ${focusRing} ${
                    mode === m ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {m === "single" ? "One engineer" : "Several at once"}
                </button>
              ))}
            </div>

            {mode === "single" ? (
              <FormInput
                label="Work email" type="email" placeholder="rep@acme.com" required
                value={newEmail} onChange={setNewEmail}
                onBlur={() => setEmailTouched(true)}
                error={emailTouched ? emailError : undefined}
                hint="They'll receive an activation email with a link to install the Gmail extension."
                autoComplete="off"
              />
            ) : (
              <div>
                <label htmlFor="bulk-emails" className="block text-[13px] font-medium text-text-primary mb-1.5">
                  Email addresses
                </label>
                <textarea
                  id="bulk-emails"
                  value={bulkText}
                  onChange={e => { setBulkText(e.target.value); setBulkError(""); setFileNote(""); }}
                  rows={7}
                  placeholder={"ali@acme.com\nsara@acme.com\n\nOr paste a whole CSV — names and other columns are ignored."}
                  className={`w-full bg-surface border border-border rounded-sm px-3 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary font-mono resize-y ${focusRing}`}
                />

                <div className="flex items-center gap-3 mt-2">
                  <input
                    ref={fileInput}
                    type="file"
                    accept=".csv,.txt,.xlsx,.ods,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="sr-only"
                    onChange={e => { const f = e.target.files?.[0]; if (f) void readFile(f); }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:underline cursor-pointer rounded-sm ${focusRing}`}
                  >
                    <Upload size={13} strokeWidth={1.5} /> Upload CSV or Excel
                  </button>
                  <span className="text-xs text-text-tertiary">Or separate with commas, semicolons or new lines.</span>
                </div>

                {/* Confirms the file landed. Without it the only feedback was the
                    textarea changing, which is easy to miss on a long list. */}
                {fileNote && (
                  <p className="mt-2 text-xs text-success flex items-center gap-1.5" role="status">
                    <CheckCircle2 size={13} strokeWidth={1.5} /> {fileNote}
                  </p>
                )}

                {/* Live preview — what will actually be sent, before sending it. */}
                {(parsed.valid.length > 0 || parsed.invalid.length > 0) && (
                  <div className="mt-3 text-xs space-y-1" aria-live="polite">
                    <p className="text-text-secondary">
                      <span className="font-semibold text-text-primary">{parsed.valid.length}</span> address
                      {parsed.valid.length === 1 ? "" : "es"} ready
                      {parsed.duplicates > 0 && <> · {parsed.duplicates} repeat{parsed.duplicates === 1 ? "" : "s"} removed</>}
                      {" · "}{seatsFree} seat{seatsFree === 1 ? "" : "s"} free
                    </p>
                    {parsed.invalid.length > 0 && (
                      <p className="text-danger">
                        {parsed.invalid.length} could not be read: {parsed.invalid.slice(0, 3).join(", ")}
                        {parsed.invalid.length > 3 && ` and ${parsed.invalid.length - 3} more`}
                      </p>
                    )}
                    {willNotFit > 0 && (
                      <p className="text-warning">
                        Only {seatsFree} will fit on your plan — the last {willNotFit} will need an upgrade.
                      </p>
                    )}
                    {parsed.truncated && (
                      <p className="text-warning">Only the first {MAX_EMAILS} addresses are used.</p>
                    )}
                  </div>
                )}

                {bulkError && <p className="text-xs text-danger mt-2" role="alert">{bulkError}</p>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Shell>
  );
}
