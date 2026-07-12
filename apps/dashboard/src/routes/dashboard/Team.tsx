import { useState, useEffect } from "react";
import { Plus, AlertTriangle, Clock, Users, UserX, Shield } from "lucide-react";
import type { Screen } from "../../types";
import { allowlist } from "../../api-client";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Btn } from "../../components/Btn";
import { FormInput } from "../../components/FormInput";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { Reveal } from "../../components/Reveal";
import { useToast } from "../../components/Toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

type Member = { email: string; name: string; initials: string; role: string; status: string; added: string };

export function Team({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    allowlist.list()
      .then(res => setMembers((res?.members ?? []).map(m => {
        const parts = m.name.split(" ");
        const initials = parts.map(p => p[0]?.toUpperCase() ?? "").join("").slice(0, 2);
        return { ...m, initials, role: "Sales Engineer" };
      })))
      .catch(err => setError(err.message || "Failed to load team data"))
      .finally(() => setLoading(false));
  }, []);

  const total = 5;
  const used = members.filter(m => m.status !== "Revoked").length;
  const atLimit = used >= total;
  const emailError = !newEmail.trim() ? "Email is required" : !EMAIL_RE.test(newEmail) ? "Enter a valid email" : "";

  const closeModal = () => { setShowModal(false); setNewEmail(""); setEmailTouched(false); };

  const sendInvite = () => {
    setEmailTouched(true);
    if (emailError || sending) return;
    setSending(true);
    allowlist.grant(newEmail)
      .then(res => {
        const parts = res.name.split(" ");
        const initials = parts.map(p => p[0]?.toUpperCase() ?? "").join("").slice(0, 2);
        setMembers(p => [...p, { ...res, initials, role: "Sales Engineer" }]);
        toast(`Invite sent to ${newEmail}`);
        closeModal();
      })
      .catch(() => {
        toast("Failed to send invite — please try again");
      })
      .finally(() => setSending(false));
  };

  const revoke = (email: string) => {
    allowlist.revoke(email).catch(() => {});
    setMembers(p => p.map(x => x.email === email ? { ...x, status: "Revoked" } : x));
    setConfirmRevoke(null);
    toast(`Access revoked for ${email}`);
  };

  return (
    <Shell active="team" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader
          title="Team"
          subtitle="Manage who has Gmail extension access."
          actions={
            <>
              <span className="text-sm text-text-tertiary"><span className="font-semibold text-text-primary">{used}</span> / {total} seats</span>
              <Btn
                variant="primary" size="sm" disabled={atLimit}
                onClick={() => setShowModal(true)}
                aria-label={atLimit ? "Add Sales Engineer — seat limit reached, upgrade tier" : "Add Sales Engineer"}
              >
                <Plus size={14} strokeWidth={2} /> Add Sales Engineer
              </Btn>
            </>
          }
        />

        {atLimit && (
          <div className="flex items-center gap-3 bg-warning-light border border-warning/20 rounded-lg px-4 py-3 mb-5 text-[13px]" role="status">
            <AlertTriangle size={14} strokeWidth={1.5} className="text-warning shrink-0" />
            <span className="text-warning">You've used all {total} seats on the Growth plan.</span>
            <button className={`text-warning underline font-medium ml-auto cursor-pointer rounded-sm ${focusRing}`}>Upgrade tier</button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <Reveal>
          <Card className="p-5 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 14%, transparent)" }}>
                <Users size={18} strokeWidth={1.5} className="text-primary" />
              </div>
              <div className="text-xs text-text-tertiary">Total Members</div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{used}</div>
            <div className="text-xs text-text-tertiary mt-1">of {total} seats used</div>
            <div className="w-full h-2 rounded-full bg-surface-tertiary overflow-hidden mt-3">
              <div className={`h-full rounded-full transition-all duration-500 ${used / total >= 0.8 ? "bg-warning" : "bg-primary"}`} style={{ width: `${(used / total) * 100}%` }} />
            </div>
          </Card>
          </Reveal>

          <Reveal delay={70}>
          <Card className="p-5 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-success) 14%, transparent)" }}>
                <Shield size={18} strokeWidth={1.5} className="text-success" />
              </div>
              <div className="text-xs text-text-tertiary">Verified</div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{members.filter(m => m.status === "Verified").length}</div>
            <div className="text-xs text-success mt-1">Extension active</div>
          </Card>
          </Reveal>

          <Reveal delay={140}>
          <Card className="p-5 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-warning) 14%, transparent)" }}>
                <Clock size={18} strokeWidth={1.5} className="text-warning" />
              </div>
              <div className="text-xs text-text-tertiary">Pending</div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{members.filter(m => m.status === "Invited").length}</div>
            <div className="text-xs text-warning mt-1">Awaiting activation</div>
          </Card>
          </Reveal>
        </div>

        {/* Members table */}
        <Reveal>
        <Card className="overflow-hidden transition-transform duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 14%, transparent)" }}>
              <Users size={18} strokeWidth={1.5} className="text-primary" />
            </div>
            <h2 className="text-subheading text-text-primary">Team members</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[34rem]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50">
                  <th scope="col" className="text-eyebrow text-left px-5 py-2.5">Member</th>
                  <th scope="col" className="text-eyebrow text-left px-5 py-2.5 w-28">Status</th>
                  <th scope="col" className="text-eyebrow text-left px-5 py-2.5 w-32">Date added</th>
                  <th scope="col" className="px-5 py-2.5 w-28"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-text-tertiary">Loading team…</td></tr>
                ) : error ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-danger">{error}</td></tr>
                ) : members.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-text-tertiary">No team members yet. Invite your first Sales Engineer above.</td></tr>
                ) : members.map((m, i) => (
                  <tr key={m.email} className={`border-b border-border last:border-0 hover:bg-surface-secondary/30 transition-colors ${i % 2 === 1 ? "bg-surface-secondary/40" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold shrink-0">{m.initials}</div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-text-primary truncate">{m.name}</div>
                          <div className="text-xs text-text-tertiary truncate">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${m.status === "Verified" ? "bg-success" : m.status === "Invited" ? "bg-warning" : "bg-danger"}`} />
                        <span className={`text-xs font-medium ${m.status === "Verified" ? "text-success" : m.status === "Invited" ? "text-warning" : "text-danger"}`}>{m.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-text-tertiary font-mono whitespace-nowrap">{m.added}</td>
                    <td className="px-5 py-3.5 text-right">
                      {m.status === "Revoked" ? (
                        <span className="text-xs text-text-tertiary">—</span>
                      ) : confirmRevoke === m.email ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setConfirmRevoke(null)} className={`text-xs text-text-tertiary hover:text-text-primary cursor-pointer rounded-sm ${focusRing}`}>Cancel</button>
                          <button onClick={() => revoke(m.email)} className={`text-xs text-danger font-medium cursor-pointer rounded-sm ${focusRing}`}>Confirm</button>
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
          label="Work email" type="email" placeholder="rep@acme.com" required
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
