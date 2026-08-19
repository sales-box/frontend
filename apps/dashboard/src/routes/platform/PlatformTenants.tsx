import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { platformApi, type PaginatedTenants } from "../../platform-client";
import { usePlatformAuthStore } from "../../store/platformAuth";

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  suspended: "bg-amber-500/15 text-amber-300",
  offboarded: "bg-red-500/15 text-red-300",
  pending: "bg-slate-500/15 text-slate-300",
  abandoned: "bg-slate-500/15 text-slate-400",
};

export function PlatformTenants() {
  const navigate = useNavigate();
  const logout = usePlatformAuthStore((s) => s.logout);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedTenants | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    platformApi
      .listTenants(page, 20)
      .then((r) => {
        if (active) {
          setResult(r);
          setError(null);
        }
      })
      .catch((e) => {
        if (active) setError(String(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <h1 className="text-base font-semibold">Platform · Tenants</h1>
        <button
          onClick={() => {
            logout();
            navigate("/platform/login");
          }}
          className="text-sm text-slate-400 hover:text-slate-100"
        >
          Sign out
        </button>
      </header>

      <main className="p-6">
        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {result && (
          <>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="py-2 font-medium">Company</th>
                  <th className="font-medium">Status</th>
                  <th className="font-medium">Tier</th>
                  <th className="font-medium">SEs</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-slate-800 hover:bg-slate-900"
                  >
                    <td className="py-2">
                      <Link
                        to={`/platform/tenants/${t.id}`}
                        className="text-slate-100 hover:underline"
                      >
                        {t.companyName}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${STATUS_TONE[t.status] ?? ""}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td>{t.tier}</td>
                    <td>{t.seCount}</td>
                  </tr>
                ))}
                {result.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-slate-500"
                    >
                      No tenants yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="mt-4 flex items-center gap-3 text-sm">
              <button
                disabled={!result.meta.prev}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-slate-400">
                Page {result.meta.currentPage} / {result.meta.lastPage || 1}
              </span>
              <button
                disabled={!result.meta.next}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
