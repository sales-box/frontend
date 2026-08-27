import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, Contact } from "lucide-react";
import type { Screen } from "../../types";
import { useClients } from "../../hooks/queries";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { Reveal } from "../../components/Reveal";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40";

// The API sends the raw column value, so snake_case has to be humanised here
// or the pill reads "new_inquiry". An unmapped value falls through to its own
// text rather than an empty badge — a new status upstream should look odd, not
// invisible.
const STATUS_LABELS: Record<string, string> = {
  new_inquiry: "New",
  qualified: "Qualified",
  opportunity: "Opportunity",
  customer: "Customer",
  Active: "Active",
  "At risk": "At risk",
};

// Figma-tinted status pill. Colour follows the axis the status sits on: a
// healthy state is cyan, one that demands attention is red, and a neutral early
// stage stays grey — no judgement.
const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  customer: { bg: "rgba(10, 147, 150, 0.12)", fg: "#0A9396" },
  Active: { bg: "rgba(10, 147, 150, 0.12)", fg: "#0A9396" },
  opportunity: { bg: "rgba(148, 210, 189, 0.22)", fg: "#0A6E70" },
  qualified: { bg: "rgba(233, 216, 166, 0.35)", fg: "#8A6A12" },
  "At risk": { bg: "rgba(174, 32, 18, 0.12)", fg: "#AE2012" },
};

const NEUTRAL_STATUS = { bg: "rgba(102, 107, 112, 0.12)", fg: "#666B70" };

const statusBadge = (s?: string | null) => {
  // Every client has a status — a brand new one is "New". This guard is only so
  // a missing or undefined value renders as nothing rather than an empty pill or
  // the word "undefined".
  if (!s?.trim()) return null;
  const style = STATUS_STYLES[s] ?? NEUTRAL_STATUS;
  return (
    <span
      className="inline-flex items-center rounded px-2.5 py-1 text-[12px] font-medium"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {STATUS_LABELS[s] ?? s}
    </span>
  );
};

export function Clients({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const navigate = useNavigate();
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

  const { data: res, isLoading, error } = useClients(page, limit, debouncedQuery);
  const data = res?.data ?? [];
  const total = res?.meta?.total ?? 0;

  const totalPages = Math.ceil(total / limit);

  return (
    <Shell active="clients" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
        <PageHeader
          title="Clients"
          subtitle="Everyone your team has corresponded with."
          actions={
            <span className="text-[14px] text-text-tertiary">
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
            className="w-full pl-9 pr-3.5 py-2.5 text-[14px] font-body bg-surface text-text-primary rounded-md border border-border focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-primary/25 placeholder:text-text-tertiary transition-colors"
          />
        </div>

        <Reveal>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <Contact size={18} strokeWidth={1.5} className="text-text-tertiary" />
            <h2 className="text-subheading text-text-primary">All contacts</h2>
          </div>

          {isLoading ? (
            <div className="px-5 py-10 text-center text-[14px] text-text-tertiary">Loading clients…</div>
          ) : error ? (
            <div className="px-5 py-10 text-center text-[14px] text-danger">{error ? (error as Error).message : null}</div>
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
                    const initials = (c.name || c.email).split(/[\s@]/).map(p => p[0]?.toUpperCase() ?? "").join("").slice(0, 2);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/dashboard/clients/${c.id}`)}
                        className={`border-b border-border last:border-0 hover:bg-surface-secondary/30 transition-colors cursor-pointer ${i % 2 === 1 ? "bg-surface-secondary/40" : ""}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 text-primary"
                              style={{ backgroundColor: "rgba(148, 210, 189, 0.3)" }}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[14px] font-medium text-text-primary truncate">{c.name || c.email}</div>
                              <div className="text-[12px] text-text-tertiary truncate">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[14px] text-text-secondary truncate">{c.company}</td>
                        <td className="px-5 py-3.5">{statusBadge(c.status)}</td>
                        <td className="px-5 py-3.5 text-[12px] text-text-tertiary">{c.crmId ?? "—"}</td>
                        <td className="px-5 py-3.5 text-[12px] text-text-tertiary font-mono whitespace-nowrap">{c.updatedAt}</td>
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
                className={`text-[12px] font-medium text-text-secondary disabled:text-text-tertiary disabled:cursor-not-allowed cursor-pointer ${focusRing}`}
              >
                Previous
              </button>
              <span className="text-[12px] text-text-tertiary">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`text-[12px] font-medium text-text-secondary disabled:text-text-tertiary disabled:cursor-not-allowed cursor-pointer ${focusRing}`}
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
