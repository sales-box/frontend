import { useEffect, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ChevronRight,
  Search,
} from "lucide-react";
import type { TenantStatus } from "../../platform-client";
import {
  usePlatformTenants,
  useDebounced,
} from "../../hooks/platformQueries";
import {
  relativeTime,
  tierLabel,
  friendlyError,
} from "../../lib/platformFormat";
import { OperatorShell } from "../../components/platform/OperatorShell";
import { PlatformOverview } from "../../components/platform/PlatformOverview";
import { TenantStatusBadge } from "../../components/platform/TenantStatusBadge";
import { Card } from "../../components/Card";
import { Btn } from "../../components/Btn";
import { EmptyState } from "../../components/EmptyState";
import { FormInput } from "../../components/FormInput";
import { PageHeader } from "../../components/PageHeader";

const FILTERS: { label: string; value: TenantStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Pending", value: "pending" },
  { label: "Offboarded", value: "offboarded" },
  { label: "Abandoned", value: "abandoned" },
];

/**
 * Whole-row navigation without an absolutely positioned overlay.
 *
 * The overlay this replaces was a `position: absolute; inset: 0` span whose
 * containing block was supposed to be its `position: relative` row — but a
 * `<tr>` does not reliably establish one, so the span fell through to the
 * viewport, sized itself to the full 42rem table, and scrolled the whole PAGE
 * sideways by 176px on a narrow screen. The table's own `overflow-x-auto`
 * could not clip it, because clipping only applies to descendants whose
 * containing-block chain runs through the scroller.
 *
 * A click handler has no box, so there is nothing to escape. The real `<Link>`
 * stays on the company name and remains the keyboard and open-in-new-tab path;
 * this only adds the convenience of clicking the rest of the row.
 */
function useOpenRow() {
  const navigate = useNavigate();
  return (event: MouseEvent<HTMLTableRowElement>, id: string) => {
    // Anything the link already handles, or that the browser should: a
    // modified click must still open a new tab, and a drag that selected text
    // must not navigate out from under the selection.
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if ((event.target as HTMLElement).closest("a")) return;
    if (window.getSelection()?.toString()) return;
    navigate(`/admin/tenants/${id}`);
  };
}

export function PlatformTenants() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<TenantStatus | "">("");
  const search = useDebounced(searchInput);

  // A filter change makes the current page number meaningless — page 4 of the
  // unfiltered list is very unlikely to exist in the filtered one.
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const tenants = usePlatformTenants(page, { search, status });
  const openRow = useOpenRow();

  const rows = tenants.data?.data ?? [];
  const meta = tenants.data?.meta;
  const filtering = search !== "" || status !== "";

  return (
    <OperatorShell>
      <PageHeader title="Tenants" subtitle="Every workspace on the platform" />

      <PlatformOverview />

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <FormInput
            placeholder="Search by company name"
            value={searchInput}
            onChange={setSearchInput}
            trailing={
              <Search
                size={15}
                strokeWidth={1.5}
                className="text-text-tertiary"
              />
            }
          />
        </div>

        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-wrap gap-1.5"
        >
          {FILTERS.map((f) => {
            const on = status === f.value;
            return (
              <button
                key={f.label}
                type="button"
                aria-pressed={on}
                onClick={() => setStatus(f.value)}
                className={`rounded-full border px-3 py-1 text-[13px] font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
                  on
                    ? "border-primary bg-primary text-text-on-primary shadow-1"
                    : "border-border bg-surface text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        {tenants.isError ? (
          <div
            role="alert"
            className="flex items-start gap-2 px-5 py-6 text-[13px] text-danger"
          >
            <AlertCircle size={15} strokeWidth={1.5} className="mt-0.5" />
            <span>{friendlyError(tenants.error)}</span>
          </div>
        ) : tenants.isPending ? (
          <SkeletonTable />
        ) : rows.length === 0 ? (
          <EmptyState
            title={
              filtering ? "No tenants match those filters" : "No tenants yet"
            }
            description={
              filtering
                ? "Try a different company name, or clear the status filter."
                : "Workspaces will appear here as companies sign up."
            }
            action={
              filtering ? (
                <Btn
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchInput("");
                    setStatus("");
                  }}
                >
                  Clear filters
                </Btn>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-eyebrow px-5 py-3 font-semibold">
                    Company
                  </th>
                  <th className="text-eyebrow px-3 py-3 font-semibold">
                    Status
                  </th>
                  <th className="text-eyebrow px-3 py-3 font-semibold">Plan</th>
                  <th className="text-eyebrow px-3 py-3 text-right font-semibold">
                    Seats
                  </th>
                  <th className="text-eyebrow px-3 py-3 font-semibold">
                    Joined
                  </th>
                  <th className="relative w-10 px-3 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={t.id}
                    onClick={(e) => openRow(e, t.id)}
                    className="group cursor-pointer border-b border-border/60 last:border-0 transition-colors hover:bg-surface-secondary"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/admin/tenants/${t.id}`}
                        className="rounded-sm font-medium text-text-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                      >
                        {t.companyName}
                      </Link>
                    </td>
                    <td className="px-3 py-3.5">
                      <TenantStatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-3.5 text-text-secondary">
                      {tierLabel(t.tier)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-text-secondary">
                      {t.seCount}
                    </td>
                    <td className="px-3 py-3.5 text-text-tertiary">
                      {relativeTime(t.createdAt)}
                    </td>
                    <td className="px-3 py-3.5">
                      <ChevronRight
                        size={16}
                        strokeWidth={1.5}
                        className="text-text-tertiary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Pagination ───────────────────────────────────────── */}
      {meta && meta.lastPage > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-caption text-text-tertiary">
            {meta.total} tenant{meta.total === 1 ? "" : "s"} · page{" "}
            {meta.currentPage} of {meta.lastPage}
          </p>
          <div className="flex gap-2">
            <Btn
              variant="secondary"
              size="sm"
              disabled={!meta.prev}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Btn>
            <Btn
              variant="secondary"
              size="sm"
              disabled={!meta.next}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Btn>
          </div>
        </div>
      )}
    </OperatorShell>
  );
}

/** Placeholder rows so the layout does not jump when real data lands. */
function SkeletonTable() {
  return (
    <div className="divide-y divide-border/60" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="h-4 flex-1 animate-pulse rounded bg-surface-tertiary" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-surface-tertiary" />
          <div className="h-4 w-16 animate-pulse rounded bg-surface-tertiary" />
          <div className="h-4 w-8 animate-pulse rounded bg-surface-tertiary" />
          <div className="h-4 w-24 animate-pulse rounded bg-surface-tertiary" />
        </div>
      ))}
    </div>
  );
}
