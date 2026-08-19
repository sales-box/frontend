import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { platformApi, type TenantDetail } from "../../platform-client";

const TIERS = [1, 2, 3];

export function PlatformTenantDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const load = useCallback(() => {
    platformApi
      .getTenant(id)
      .then((t) => {
        setTenant(t);
        setError(null);
      })
      .catch((e) => setError(String(e)));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!tenant) {
    return (
      <Shell>
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <p className="text-sm text-slate-400">Loading…</p>
        )}
      </Shell>
    );
  }

  const isActive = tenant.status === "active";
  const isSuspended = tenant.status === "suspended";
  const isTerminal =
    tenant.status === "offboarded" || tenant.status === "abandoned";

  return (
    <Shell onBack={() => navigate("/platform")}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">{tenant.companyName}</h1>
          <p className="text-sm text-slate-400">
            {tenant.status} · tier {tenant.tier}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="SEs" value={tenant.seCount} />
          <Stat label="Documents" value={tenant.docCount} />
          <Stat label="Emails" value={tenant.emailCount} />
          <Stat
            label="Last activity"
            value={
              tenant.lastActivityAt
                ? new Date(tenant.lastActivityAt).toLocaleDateString()
                : "—"
            }
          />
        </dl>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {isTerminal ? (
          <p className="text-sm text-slate-500">
            This tenant is {tenant.status} — no further actions.
          </p>
        ) : (
          <section className="space-y-4 rounded-lg border border-slate-800 p-4">
            <h2 className="text-sm font-medium text-slate-300">Actions</h2>

            <div className="flex flex-wrap gap-2">
              {isActive && (
                <button
                  disabled={busy}
                  onClick={() =>
                    run(() => platformApi.changeStatus(id, "suspend"))
                  }
                  className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  Suspend
                </button>
              )}
              {isSuspended && (
                <button
                  disabled={busy}
                  onClick={() =>
                    run(() => platformApi.changeStatus(id, "activate"))
                  }
                  className="rounded-md bg-emerald-500/90 px-3 py-1.5 text-sm text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  Reactivate
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Tier</label>
              <select
                value={tenant.tier}
                disabled={busy}
                onChange={(e) =>
                  run(() => platformApi.changeTier(id, Number(e.target.value)))
                }
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    Tier {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 rounded-md border border-red-900/50 bg-red-950/20 p-3">
              <p className="text-sm text-red-300">
                Offboard is terminal. Type <b>{tenant.companyName}</b> to
                confirm.
              </p>
              <div className="flex gap-2">
                <input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Company name"
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                />
                <button
                  disabled={busy || confirmName !== tenant.companyName}
                  onClick={() =>
                    run(() => platformApi.changeStatus(id, "offboard"))
                  }
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500 disabled:opacity-40"
                >
                  Offboard
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-800 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}

function Shell({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="flex items-center gap-3 border-b border-slate-800 px-6 py-4">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-slate-400 hover:text-slate-100"
          >
            ← Tenants
          </button>
        )}
        <span className="text-base font-semibold">Platform</span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
