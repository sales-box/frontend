import { Activity, Calendar, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import type { Screen } from "../../types";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { Reveal } from "../../components/Reveal";
import { Btn } from "../../components/Btn";
import { useActivityFeed, useEscalations, useResolveEscalation } from "../../hooks/queries";
import { useToast } from "../../components/Toast";

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

function formatDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}



const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40";
const COLS = "grid grid-cols-[80px_1fr_1fr_140px_100px_100px] gap-3";
const LIMIT = 20;

export function ActivityFeed({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<"escalations" | "activity">("escalations");
  const [page, setPage] = useState(1);
  const [escPage, setEscPage] = useState(1);
  const [date, setDate] = useState("");

  const { data, isLoading, isError } = useActivityFeed(page, LIMIT, date);
  const { data: escData, isLoading: escLoading, isError: escError } = useEscalations(escPage, LIMIT, "pending", date);
  const resolveEscalation = useResolveEscalation();

  const rows: ActivityRow[] = (data?.data ?? []) as ActivityRow[];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  const escRows = escData?.data ?? [];
  const escMeta = escData?.meta;
  const escTotalPages = escMeta ? Math.ceil(escMeta.total / escMeta.limit) : 1;

  const handleResolve = async (id: string) => {
    try {
      await resolveEscalation.mutateAsync({ id, status: "reviewed" });
      toast("Escalation marked as reviewed");
    } catch {
      toast("Failed to update escalation status");
    }
  };

  return (
    <Shell active="activity-feed" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
        <PageHeader
          title="Activity Feed"
          subtitle="Monitor team emails, urgent flags, and sensitive client complaints."
          actions={
            <>
              <Calendar size={16} strokeWidth={1.5} className="text-text-tertiary" />
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setPage(1); setEscPage(1); }}
                className={`text-[15px] bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-text-primary ${focusRing}`}
              />
              {date ? (
                <button
                  onClick={() => { setDate(""); setPage(1); setEscPage(1); }}
                  className="text-[13px] text-primary hover:underline px-2 py-1 rounded bg-primary/10"
                >
                  All Dates
                </button>
              ) : (
                <span className="text-[13px] text-text-tertiary font-medium">All Dates</span>
              )}
            </>
          }
        />

        {/* Filter pills — Figma: active = cyan filled, inactive = grey text */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setTab("escalations")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] transition-colors cursor-pointer ${focusRing} ${tab === "escalations" ? "font-semibold text-white" : "font-medium hover:bg-surface-secondary"}`}
            style={tab === "escalations" ? { backgroundColor: "var(--brand-cyan)" } : { color: "var(--color-text-tertiary)" }}
          >
            <ShieldAlert size={16} strokeWidth={1.5} />
            <span>Needs attention</span>
            {(escMeta?.total ?? 0) > 0 && (
              <span className="ml-1 text-[13px] font-bold">{escMeta?.total}</span>
            )}
          </button>
          <button
            onClick={() => setTab("activity")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] transition-colors cursor-pointer ${focusRing} ${tab === "activity" ? "font-semibold text-white" : "font-medium hover:bg-surface-secondary"}`}
            style={tab === "activity" ? { backgroundColor: "var(--brand-cyan)" } : { color: "var(--color-text-tertiary)" }}
          >
            <Activity size={16} strokeWidth={1.5} />
            <span>All activity</span>
          </button>
        </div>

        {tab === "escalations" ? (
          <Reveal>
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
                <div>
                  <h2 className="text-subheading text-text-primary">Admin Attention Required</h2>
                  <p className="text-[13px] text-text-tertiary">Urgent messages, sensitive complaints, or high-risk emails flagged for oversight.</p>
                </div>
                {escMeta && <span className="text-[13px] text-text-tertiary ml-auto">{escMeta.total} pending</span>}
              </div>

              {escLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-primary" />
                </div>
              ) : escError ? (
                <div className="px-5 py-10 text-center text-[15px] text-danger">Failed to load escalation items.</div>
              ) : escRows.length === 0 ? (
                <EmptyState
                  title="No pending escalations"
                  description="Great news! There are currently no urgent or sensitive complaints requiring admin intervention."
                />
              ) : (
                <div className="divide-y divide-border">
                  {escRows.map((item) => {
                    // One colour cue per row: a severity stripe + the severity
                    // word. Everything else stays neutral so the list reads
                    // calmly instead of as a wall of coloured pills.
                    const sevBar = item.severity === "high" ? "var(--color-danger)"
                      : item.severity === "medium" ? "var(--color-warning)"
                      : "var(--color-text-tertiary)";
                    const sevText = item.severity === "high" ? "text-danger"
                      : item.severity === "medium" ? "text-warning"
                      : "text-text-tertiary";
                    return (
                      <div key={item.id} className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 hover:bg-surface-secondary/20 transition-colors">
                        <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ backgroundColor: sevBar }} />
                        <div className="flex-1 min-w-0 pl-3">
                          {/* Meta — all muted; only the severity word is tinted */}
                          <div className="flex items-center gap-2 text-[13px] text-text-tertiary flex-wrap mb-1">
                            <span className={`font-semibold uppercase tracking-wide ${sevText}`}>{item.severity}</span>
                            {item.analysis?.intent && <><span aria-hidden>·</span><span>{item.analysis.intent}</span></>}
                            {item.analysis?.isUrgent && <><span aria-hidden>·</span><span className="text-warning font-medium">Urgent</span></>}
                            <span className="ml-auto">{formatDate(item.createdAt)}</span>
                          </div>

                          <div className="text-[15px] font-semibold text-text-primary">
                            {item.subject ?? item.reason}
                          </div>

                          {/* Client + SE on one muted line — no bold, no mono */}
                          <div className="text-[13px] text-text-tertiary mt-0.5 truncate">
                            {item.client?.name || item.client?.email || "Unknown"}
                            {item.client?.company ? ` · ${item.client.company}` : ""}
                            {` · ${item.accountEmail}`}
                          </div>

                          {item.reason && (
                            <div className="text-[13px] text-text-tertiary mt-1.5">
                              <span className="text-text-secondary">Reason:</span> {item.reason}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 self-end md:self-center">
                          <Btn
                            variant="secondary"
                            size="sm"
                            loading={resolveEscalation.isPending}
                            onClick={() => handleResolve(item.id)}
                          >
                            <CheckCircle2 size={13} strokeWidth={1.5} /> Mark Reviewed
                          </Btn>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {escTotalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                  <button
                    onClick={() => setEscPage((p) => Math.max(1, p - 1))}
                    disabled={escPage <= 1}
                    className={`text-[13px] font-medium text-text-secondary disabled:text-text-tertiary disabled:cursor-not-allowed cursor-pointer ${focusRing}`}
                  >
                    Previous
                  </button>
                  <span className="text-[13px] text-text-tertiary">Page {escPage} of {escTotalPages}</span>
                  <button
                    onClick={() => setEscPage((p) => Math.min(escTotalPages, p + 1))}
                    disabled={escPage >= escTotalPages}
                    className={`text-[13px] font-medium text-text-secondary disabled:text-text-tertiary disabled:cursor-not-allowed cursor-pointer ${focusRing}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </Card>
          </Reveal>
        ) : (
          <Reveal>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
              <Activity size={18} strokeWidth={1.5} className="text-text-tertiary" />
              <h2 className="text-subheading text-text-primary">Activity</h2>
              {meta && <span className="text-[13px] text-text-tertiary ml-auto">{meta.total} total</span>}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="px-5 py-10 text-center text-[15px] text-danger">Failed to load activity feed.</div>
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
                        <span className="text-[13px] text-text-tertiary font-mono">{formatTime(row.time)}</span>
                        <span className="text-[15px] font-medium text-text-primary truncate">{row.client}</span>
                        <span className="text-[15px] text-text-secondary truncate">{row.company}</span>
                        <span>{row.classification && <Badge variant="muted">{row.classification}</Badge>}</span>
                        <span className={`text-[15px] font-mono font-semibold ${conf != null ? confidenceColor(conf) : "text-text-tertiary"}`}>
                          {conf != null ? `${conf}%` : "—"}
                        </span>
                        <span className={`text-[13px] font-medium ${actionColor(row.action)}`}>{row.action ?? "—"}</span>
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
                  className={`text-[13px] font-medium text-text-secondary disabled:text-text-tertiary disabled:cursor-not-allowed cursor-pointer ${focusRing}`}
                >
                  Previous
                </button>
                <span className="text-[13px] text-text-tertiary">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`text-[13px] font-medium text-text-secondary disabled:text-text-tertiary disabled:cursor-not-allowed cursor-pointer ${focusRing}`}
                >
                  Next
                </button>
              </div>
            )}
          </Card>
          </Reveal>
        )}
      </div>
    </Shell>
  );
}
