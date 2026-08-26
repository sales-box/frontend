import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Clock,
  Mail,
  PauseCircle,
  PlayCircle,
  Users,
} from "lucide-react";
import {
  usePlatformTenant,
  useChangeTenantStatus,
  useChangeTenantTier,
} from "../../hooks/platformQueries";
import {
  TIER_NAMES,
  friendlyError,
  relativeTime,
  tierLabel,
} from "../../lib/platformFormat";
import { OperatorShell } from "../../components/platform/OperatorShell";
import { TenantStatusBadge } from "../../components/platform/TenantStatusBadge";
import { Card } from "../../components/Card";
import { Btn } from "../../components/Btn";
import { Modal } from "../../components/Modal";
import { FormInput } from "../../components/FormInput";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { useToast } from "../../components/Toast";

const TIERS = [1, 2, 3];

/** Which confirmation, if any, is currently open. */
type Pending = null | { kind: "tier"; tier: number } | { kind: "offboard" };

export function PlatformTenantDetail() {
  const { id = "" } = useParams();
  const toast = useToast();

  const { data: tenant, isPending, isError, error } = usePlatformTenant(id);
  const changeStatus = useChangeTenantStatus();
  const changeTier = useChangeTenantTier();

  const [pending, setPending] = useState<Pending>(null);
  const [confirmName, setConfirmName] = useState("");

  const busy = changeStatus.isPending || changeTier.isPending;

  function closeModal() {
    setPending(null);
    setConfirmName("");
  }

  /** Runs a mutation, reports it, and closes whatever confirmation opened it. */
  async function run(
    fn: () => Promise<unknown>,
    success: string,
    after?: () => void,
  ) {
    try {
      await fn();
      toast(success);
      closeModal();
      after?.();
    } catch (e) {
      toast(friendlyError(e), "error");
    }
  }

  if (isPending) {
    return (
      <OperatorShell>
        <div className="space-y-6" aria-hidden="true">
          <div className="h-10 w-64 animate-pulse rounded bg-surface-tertiary" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl bg-surface-tertiary"
              />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-xl bg-surface-tertiary" />
        </div>
      </OperatorShell>
    );
  }

  if (isError || !tenant) {
    return (
      <OperatorShell>
        <BackLink />
        <Card className="mt-4 p-6">
          <div
            role="alert"
            className="flex items-start gap-2 text-[13px] text-danger"
          >
            <AlertCircle size={15} strokeWidth={1.5} className="mt-0.5" />
            <span>{friendlyError(error)}</span>
          </div>
        </Card>
      </OperatorShell>
    );
  }

  const isActive = tenant.status === "active";
  const isSuspended = tenant.status === "suspended";
  const canOffboard = isActive || isSuspended;
  // A closed workspace's plan is not editable — there is nothing left to bill.
  const isTerminal =
    tenant.status === "offboarded" || tenant.status === "abandoned";
  const nameMatches = confirmName === tenant.companyName;

  return (
    <OperatorShell>
      <BackLink />

      <div className="mt-4">
        <PageHeader
          title={tenant.companyName}
          subtitle={`Joined ${relativeTime(tenant.createdAt)}`}
          actions={
            <div className="flex items-center gap-2">
              <TenantStatusBadge status={tenant.status} />
              <span className="text-caption text-text-tertiary">
                {tierLabel(tenant.tier)}
              </span>
            </div>
          }
        />
      </div>

      {/* ── Usage ────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Sales engineers"
          value={String(tenant.seCount)}
          icon={<Users size={16} strokeWidth={1.5} />}
          tone="blue"
          size="sm"
        />
        <StatCard
          label="Documents"
          value={String(tenant.docCount)}
          icon={<BookOpen size={16} strokeWidth={1.5} />}
          tone="green"
          size="sm"
        />
        <StatCard
          label="Emails analysed"
          value={String(tenant.emailCount)}
          icon={<Mail size={16} strokeWidth={1.5} />}
          tone="blue"
          size="sm"
        />
        <StatCard
          label="Last activity"
          value={relativeTime(tenant.lastActivityAt)}
          icon={<Clock size={16} strokeWidth={1.5} />}
          tone="amber"
          size="sm"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Access ─────────────────────────────────────────── */}
        <Card className="p-5">
          <h2 className="text-subheading text-text-primary">Access</h2>
          <p className="text-body mt-1 text-text-secondary">
            Suspending blocks every user in this workspace immediately. Nothing
            is deleted, and reactivating restores access exactly as it was.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {isActive && (
              <Btn
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => changeStatus.mutateAsync({ id, action: "suspend" }),
                    `${tenant.companyName} is suspended.`,
                  )
                }
              >
                <PauseCircle size={15} strokeWidth={1.5} />
                Suspend
              </Btn>
            )}
            {isSuspended && (
              <Btn
                disabled={busy}
                onClick={() =>
                  void run(
                    () => changeStatus.mutateAsync({ id, action: "activate" }),
                    `${tenant.companyName} is active again.`,
                  )
                }
              >
                <PlayCircle size={15} strokeWidth={1.5} />
                Reactivate
              </Btn>
            )}
            {!canOffboard && (
              <p className="text-caption text-text-tertiary">
                No access changes are available for a{" "}
                {tenant.status === "pending" ? "pending" : "closed"} workspace.
              </p>
            )}
          </div>
        </Card>

        {/* ── Plan ───────────────────────────────────────────── */}
        <Card className="p-5">
          <h2 className="text-subheading text-text-primary">Plan</h2>
          <p className="text-body mt-1 text-text-secondary">
            An operator override of the workspace&apos;s seat and document
            limits. It does not charge or refund anything.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <label
              htmlFor="tier-select"
              className="text-[13px] font-medium text-text-primary"
            >
              Tier
            </label>
            <select
              id="tier-select"
              value={tenant.tier}
              disabled={busy || isTerminal}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (next !== tenant.tier)
                  setPending({ kind: "tier", tier: next });
              }}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-body text-text-primary shadow-1 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-50"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {TIER_NAMES[t]}
                </option>
              ))}
            </select>
          </div>
        </Card>
      </div>

      {/* ── Danger zone ──────────────────────────────────────── */}
      <Card className="mt-4 border-danger/30 p-5">
        <h2 className="text-subheading text-danger">Danger zone</h2>

        {canOffboard && (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body text-text-secondary">
              <span className="font-semibold text-text-primary">Offboard</span>{" "}
              revokes every account in this workspace. It cannot be undone, but
              the data is retained.
            </p>
            <Btn
              variant="danger"
              disabled={busy}
              onClick={() => setPending({ kind: "offboard" })}
            >
              Offboard
            </Btn>
          </div>
        )}

        {!canOffboard && (
          <p className="text-body mt-2 text-text-tertiary">
            Nothing to do here for a {tenant.status} workspace.
          </p>
        )}
      </Card>

      {/* ── Confirmations ────────────────────────────────────── */}
      <Modal
        open={pending?.kind === "tier"}
        onClose={closeModal}
        title="Change this workspace's plan?"
        footer={
          <div className="flex justify-end gap-2">
            <CancelButton onClick={closeModal} disabled={busy} />
            <Btn
              loading={busy}
              onClick={() => {
                if (pending?.kind !== "tier") return;
                const tier = pending.tier;
                void run(
                  () => changeTier.mutateAsync({ id, tier }),
                  `${tenant.companyName} moved to ${tierLabel(tier)}.`,
                );
              }}
            >
              Change plan
            </Btn>
          </div>
        }
      >
        <p className="text-body text-text-secondary">
          {tenant.companyName} will move from{" "}
          <b className="text-text-primary">{tierLabel(tenant.tier)}</b> to{" "}
          <b className="text-text-primary">
            {pending?.kind === "tier" ? tierLabel(pending.tier) : ""}
          </b>
          . Seat and document limits change immediately. No payment is taken.
        </p>
      </Modal>

      <Modal
        open={pending?.kind === "offboard"}
        onClose={closeModal}
        title="Offboard this workspace?"
        footer={
          <div className="flex justify-end gap-2">
            <CancelButton onClick={closeModal} disabled={busy} />
            <Btn
              variant="danger"
              loading={busy}
              disabled={!nameMatches}
              onClick={() =>
                void run(
                  () => changeStatus.mutateAsync({ id, action: "offboard" }),
                  `${tenant.companyName} has been offboarded.`,
                )
              }
            >
              Offboard
            </Btn>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-body text-text-secondary">
            Every account in {tenant.companyName} loses access immediately and
            this cannot be reversed. The workspace&apos;s data is retained.
          </p>
          <FormInput
            label={`Type "${tenant.companyName}" to confirm`}
            value={confirmName}
            onChange={setConfirmName}
            placeholder={tenant.companyName}
          />
        </div>
      </Modal>

    </OperatorShell>
  );
}

function CancelButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Btn variant="secondary" onClick={onClick} disabled={disabled}>
      Cancel
    </Btn>
  );
}

function BackLink() {
  return (
    <Link
      to="/admin"
      className="inline-flex items-center gap-1.5 rounded-sm text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
    >
      <ArrowLeft size={15} strokeWidth={1.5} />
      All tenants
    </Link>
  );
}
