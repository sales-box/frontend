import { useState } from "react";
import { AlertCircle, ShieldCheck, Trash2, UserX } from "lucide-react";
import type { TenantMember } from "../../platform-client";
import {
  usePlatformMembers,
  useRemoveMember,
} from "../../hooks/platformQueries";
import { friendlyError, relativeTime } from "../../lib/platformFormat";
import { memberAccess, type AccessTone } from "../../lib/memberAccess";
import { Card } from "../Card";
import { Btn } from "../Btn";
import { Modal } from "../Modal";
import { FormInput } from "../FormInput";
import { EmptyState } from "../EmptyState";
import { useToast } from "../Toast";

const TONE_CLASS: Record<AccessTone, string> = {
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  muted: "bg-surface-tertiary text-text-tertiary",
};

export function TenantMembers({
  tenantId,
  companyName,
}: {
  tenantId: string;
  companyName: string;
}) {
  const toast = useToast();
  const { data: members, isPending, isError, error } = usePlatformMembers(tenantId);
  const removeMember = useRemoveMember();

  const [pending, setPending] = useState<TenantMember | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");

  function close() {
    setPending(null);
    setConfirmEmail("");
  }

  // Removing the admin leaves nobody who can sign in and manage the
  // workspace, so that one alone asks the operator to type the address.
  const needsTyping = pending?.role === "admin";
  const canRemove = !needsTyping || confirmEmail.trim().toLowerCase() === pending?.email;

  async function confirmRemove() {
    if (!pending) return;
    const { email } = pending;
    try {
      const result = await removeMember.mutateAsync({ id: tenantId, email });
      toast(
        result.removedAccount
          ? `${email} removed. Their mailbox is disconnected and the address is free again.`
          : `${email} removed. The address is free again.`,
      );
      close();
    } catch (e) {
      toast(
        friendlyError(e, `${email} is no longer a member of this workspace.`),
        "error",
      );
    }
  }

  return (
    <>
      <Card className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-subheading text-text-primary">Members</h2>
            <p className="text-body mt-1 text-text-secondary">
              Everyone attached to {companyName} — seats and connected mailboxes.
            </p>
          </div>
          {!!members?.length && (
            <span className="text-caption whitespace-nowrap text-text-tertiary">
              {members.length} {members.length === 1 ? "person" : "people"}
            </span>
          )}
        </div>

        {isError ? (
          <div
            role="alert"
            className="flex items-start gap-2 px-5 py-6 text-[13px] text-danger"
          >
            <AlertCircle size={15} strokeWidth={1.5} className="mt-0.5" />
            <span>
              Couldn&apos;t load the roster —{" "}
              {/* A 404 here is a missing ENDPOINT, not a missing tenant — the
                  page around it is rendering that tenant's data right now. */}
              {friendlyError(error, "The server doesn't offer a roster for this workspace.")}
            </span>
          </div>
        ) : isPending ? (
          <div className="space-y-2 p-5" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded bg-surface-tertiary"
              />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<UserX size={20} strokeWidth={1.5} />}
            title="Nobody in this workspace"
            description="No seats have been granted and no mailbox has been connected."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-eyebrow px-5 py-3 font-semibold">Person</th>
                  <th className="text-eyebrow px-3 py-3 font-semibold">Access</th>
                  <th className="text-eyebrow px-3 py-3 font-semibold">Added</th>
                  <th className="text-eyebrow px-3 py-3 font-semibold">
                    Last sign-in
                  </th>
                  <th className="w-24 px-3 py-3">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const a = memberAccess(m);
                  return (
                    <tr
                      key={m.email}
                      className="border-b border-border/60 last:border-0 transition-colors hover:bg-surface-secondary"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-text-primary">
                          {m.email}
                        </span>
                        {m.role === "admin" && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary align-middle">
                            <ShieldCheck size={11} strokeWidth={1.75} />
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_CLASS[a.tone]}`}
                        >
                          {a.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-text-secondary">
                        {relativeTime(m.addedAt)}
                      </td>
                      <td className="px-3 py-3.5 text-text-secondary">
                        {relativeTime(m.lastLoginAt)}
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <Btn
                          variant="ghost"
                          size="sm"
                          disabled={removeMember.isPending}
                          onClick={() => setPending(m)}
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                          Remove
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </Card>

      <Modal
        open={!!pending}
        onClose={close}
        title="Remove this person from the workspace?"
        footer={
          <div className="flex justify-end gap-2">
            <Btn
              variant="secondary"
              onClick={close}
              disabled={removeMember.isPending}
            >
              Cancel
            </Btn>
            <Btn
              variant="danger"
              loading={removeMember.isPending}
              disabled={!canRemove}
              onClick={() => void confirmRemove()}
            >
              <Trash2 size={15} strokeWidth={1.5} />
              Remove
            </Btn>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {needsTyping && (
            <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-light px-3 py-2.5 text-[13px] text-danger">
              <AlertCircle
                size={15}
                strokeWidth={1.5}
                className="mt-0.5 flex-shrink-0"
              />
              <span>
                This is {companyName}&apos;s admin. Removing them leaves nobody
                who can sign in or manage the workspace.
              </span>
            </div>
          )}
          <p className="text-body text-text-secondary">
            {pending?.email} loses access to {companyName} immediately
            {pending?.connected
              ? ", their mailbox is disconnected and its Google access is revoked"
              : ""}
            . The workspace keeps every email already analysed — that history
            belongs to {companyName}, not to one person.
          </p>
          <p className="text-body text-text-secondary">
            The address becomes free, so it can be added here again or used to
            register elsewhere.
          </p>
          {needsTyping && (
            <FormInput
              label={`Type "${pending?.email}" to confirm`}
              value={confirmEmail}
              onChange={setConfirmEmail}
              placeholder={pending?.email}
            />
          )}
        </div>
      </Modal>
    </>
  );
}
