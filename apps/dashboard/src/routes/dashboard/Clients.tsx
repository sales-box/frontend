import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, Contact } from "lucide-react";
import type { Screen } from "../../types";
import { clients, type Client } from "../../api-client";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { Reveal } from "../../components/Reveal";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

const statusBadge = (s: string) => {
  const v = s === "Active" ? "success" as const
    : s === "New" ? "warning" as const
    : s === "At risk" ? "danger" as const
    : "muted" as const;
  return <Badge variant={v}>{s}</Badge>;
};

export function Clients({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const navigate = useNavigate();
  const [data, setData] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  function onSearchChange(value: string) {
    setQuery(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 300);
  }

  useEffect(() => {
    setLoading(true);
    clients.list(page, limit, debouncedQuery)
      .then((res: any) => {
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        const count = res.meta?.total ?? 0;
        setData(items);
        setTotal(count);
      })
      .catch(err => setError(err.message || "Failed to load clients"))
      .finally(() => setLoading(false));
  }, [page, debouncedQuery]);

  const totalPages = Math.ceil(total / limit);

  return (
    <Shell active="clients" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader
          title="Clients"
          subtitle="Client pipeline and interaction history."
          actions={
            <span className="text-sm text-text-tertiary">
              <span className="font-mono font-semibold text-text-primary">{total}</span> clients
            </span>
          }
        />

        <div className="relative mb-4">
          <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search by name or company…"
            aria-label="Search clients"
            className="w-full pl-9 pr-3.5 py-2.5 text-sm font-body bg-surface text-text-primary rounded-md border border-border focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-primary/25 placeholder:text-text-tertiary transition-colors"
          />
        </div>

        <Reveal>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 14%, transparent)" }}>
              <Contact size={18} strokeWidth={1.5} className="text-primary" />
            </div>
            <h2 className="text-subheading text-text-primary">Client Pipeline</h2>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-text-tertiary">Loading clients…</div>
          ) : error ? (
            <div className="px-5 py-10 text-center text-sm text-danger">{error}</div>
          ) : data.length === 0 ? (
            <EmptyState
              icon={<Contact size={20} strokeWidth={1.5} />}
              title={query ? "No matches" : "No clients yet"}
              description={query ? `No clients match "${query}".` : "Clients will appear here once emails are processed."}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[40rem]">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary/50">
                    <th scope="col" className="text-eyebrow text-left px-5 py-2.5">Client</th>
                    <th scope="col" className="text-eyebrow text-left px-5 py-2.5 w-36">Company</th>
                    <th scope="col" className="text-eyebrow text-left px-5 py-2.5 w-28">Status</th>
                    <th scope="col" className="text-eyebrow text-left px-5 py-2.5 w-24">CRM ID</th>
                    <th scope="col" className="text-eyebrow text-left px-5 py-2.5 w-28">Last Updated</th>
                    <th scope="col" className="px-5 py-2.5 w-10"><span className="sr-only">View</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((c, i) => {
                    const initials = c.name.split(" ").map(p => p[0]?.toUpperCase() ?? "").join("").slice(0, 2);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/dashboard/clients/${c.id}`)}
                        className={`border-b border-border last:border-0 hover:bg-surface-secondary/30 transition-colors cursor-pointer ${i % 2 === 1 ? "bg-surface-secondary/40" : ""}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold shrink-0">{initials}</div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium text-text-primary truncate">{c.name}</div>
                              <div className="text-xs text-text-tertiary truncate">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-text-secondary truncate">{c.company}</td>
                        <td className="px-5 py-3.5">{statusBadge(c.status)}</td>
                        <td className="px-5 py-3.5 text-xs text-text-tertiary">{c.crmId ?? "—"}</td>
                        <td className="px-5 py-3.5 text-xs text-text-tertiary font-mono whitespace-nowrap">{c.updatedAt}</td>
                        <td className="px-5 py-3.5 text-right">
                          <ChevronRight size={14} strokeWidth={1.5} className="text-text-tertiary" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`text-xs font-medium text-text-secondary disabled:text-text-tertiary disabled:cursor-not-allowed cursor-pointer ${focusRing}`}
              >
                Previous
              </button>
              <span className="text-xs text-text-tertiary">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`text-xs font-medium text-text-secondary disabled:text-text-tertiary disabled:cursor-not-allowed cursor-pointer ${focusRing}`}
              >
                Next
              </button>
            </div>
          )}
        </Card>
        </Reveal>
      </div>
    </Shell>
  );
}
