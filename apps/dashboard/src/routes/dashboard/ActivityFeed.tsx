import { Activity, Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Screen } from "../../types";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { Reveal } from "../../components/Reveal";
import { useActivityFeed } from "../../hooks/queries";

export interface ActivityRow {
  id: string;
  time: string;
  client: string;
  company: string;
  classification: string | null;
  confidence: number | null;
  action: string | null;
}

function confidenceColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-danger";
}

function actionColor(action: string | null) {
  if (action === "Sent as-is") return "text-success";
  if (action === "Escalated") return "text-danger";
  return "text-warning";
}

function formatTime(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40";
const COLS = "grid grid-cols-[80px_1fr_1fr_140px_100px_100px] gap-3";
const LIMIT = 20;

export function ActivityFeed({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const [page, setPage] = useState(1);
  const [date, setDate] = useState(toDateInput(new Date()));

  const { data, isLoading, isError } = useActivityFeed(page, LIMIT, date);

  const rows: ActivityRow[] = (data?.data ?? []) as ActivityRow[];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <Shell active="activity-feed" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[72rem] mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader
          title="Activity Feed"
          subtitle="All emails processed across your Sales Engineers."
          actions={
            <div className="flex items-center gap-2">
              <Calendar size={16} strokeWidth={1.5} className="text-text-tertiary" />
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setPage(1); }}
                className={`text-sm bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-text-primary ${focusRing}`}
              />
            </div>
          }
        />

        <Reveal>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 14%, transparent)" }}>
              <Activity size={18} strokeWidth={1.5} className="text-primary" />
            </div>
            <h2 className="text-subheading text-text-primary">Activity</h2>
            {meta && <span className="text-xs text-text-tertiary ml-auto">{meta.total} total</span>}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="px-5 py-10 text-center text-sm text-danger">Failed to load activity feed.</div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Emails processed by your Sales Engineers will appear here as they come in."
            />
          ) : (
            <div className="overflow-x-auto">
              <div className={`${COLS} px-5 py-2.5 border-y border-border bg-surface-secondary/50 text-eyebrow min-w-[46rem]`}>
                <span>Time</span>
                <span>Client</span>
                <span>Company</span>
                <span>Classification</span>
                <span>Confidence</span>
                <span>Action</span>
              </div>
              <div className="divide-y divide-border min-w-[46rem]">
                {rows.map((row, i) => {
                  const conf = row.confidence != null ? Math.round(row.confidence * 100) : null;
                  return (
                    <div
                      key={row.id}
                      onClick={() => onNav("clients")}
                      className={`${COLS} px-5 py-3.5 items-center hover:bg-surface-secondary/30 transition-colors cursor-pointer ${i % 2 === 1 ? "bg-surface-secondary/40" : ""}`}
                    >
                      <span className="text-xs text-text-tertiary font-mono">{formatTime(row.time)}</span>
                      <span className="text-[13px] font-medium text-text-primary truncate">{row.client}</span>
                      <span className="text-[13px] text-text-secondary truncate">{row.company}</span>
                      <span>{row.classification && <Badge variant="muted">{row.classification}</Badge>}</span>
                      <span className={`text-[13px] font-mono font-semibold ${conf != null ? confidenceColor(conf) : "text-text-tertiary"}`}>
                        {conf != null ? `${conf}%` : "—"}
                      </span>
                      <span className={`text-xs font-medium ${actionColor(row.action)}`}>{row.action ?? "—"}</span>
                    </div>
                  );
                })}
              </div>
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
