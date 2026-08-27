import { useState } from "react";
import { Plus, AlertTriangle, Clock, Users, UserX, Shield } from "lucide-react";
import type { Screen } from "../../types";
import { useTeamStats, useGrantAccess, useRevokeAccess, useTenant } from "../../hooks/queries";
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

export function Team({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const { data: tenant } = useTenant();
  const { data: rawMembers, isLoading: loading, error } = useTeamStats();
  const grantAccess = useGrantAccess();
  const revokeAccess = useRevokeAccess();

  const members = (rawMembers ?? []).filter(m => m.status !== "revoked").map(m => ({
    email: m.email,
    initials: m.email.substring(0, 2).toUpperCase(),
    role: "Sales Engineer",
    status: m.status,
    grantedAt: m.grantedAt,
    lastLoginAt: m.lastLoginAt,
    repliesSent: m.repliesSent,
    emailsReceived: m.emailsReceived,
    replyRate: m.replyRate,
  }));
  const sending = grantAccess.isPending;

  const total = seatCap(tenant?.tier);
  const used = members.filter(m => m.status !== "revoked").length;
  const atLimit = used >= total;
  const planName = tenant?.tier != null ? TIER_NAMES[tenant.tier] : undefined;
  const emailError = !newEmail.trim() ? "Email is required" : !EMAIL_RE.test(newEmail) ? "Enter a valid email" : "";

  const closeModal = () => { setShowModal(false); setNewEmail(""); setEmailTouched(false); };

  const sendInvite = async () => {
    setEmailTouched(true);
    if (emailError || sending) return;
    try {
      await grantAccess.mutateAsync(newEmail);
      toast(`Invite sent to ${newEmail}`);
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

  const revoke = async (email: string) => {
    setConfirmRevoke(null);
    try {
      await revokeAccess.mutateAsync(email);
      toast(`Access revoked for ${email}`);
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
                {members.filter(m => m.lastLoginAt).length}
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
              <div className="text-2xl font-display font-bold text-text-primary">{members.filter(m => m.status === "granted").length}</div>
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
                    <tr key={m.email} className={`border-b border-border last:border-0 hover:bg-surface-secondary/30 transition-colors ${i % 2 === 1 ? "bg-surface-secondary/40" : ""}`}>
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
                          <span className="text-[12px] text-text-tertiary">—</span>
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
        title="Add Sales Engineer"
        footer={
          <>
            <Btn variant="secondary" size="sm" onClick={closeModal}>Cancel</Btn>
            <Btn variant="primary" size="sm" loading={sending} onClick={sendInvite}>Send invite</Btn>
          </>
        }
      >
        <FormInput
          label="Work email" type="email" placeholder="name@yourcompany.com" required
          value={newEmail} onChange={setNewEmail}
          onBlur={() => setEmailTouched(true)}
          error={emailTouched ? emailError : undefined}
          hint="They'll receive an activation email with a link to install the Gmail extension."
          autoComplete="off"
        />
      </Modal>
    </Shell>
  );
}
