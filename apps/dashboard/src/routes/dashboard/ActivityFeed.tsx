import { Activity, Calendar, Loader2, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
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
      <div className="max-w-[72rem] mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader
          title="Activity & Escalation Feed"
          subtitle="Monitor team emails, urgent flags, and sensitive client complaints."
          actions={
            <div className="flex items-center gap-2">
              <Calendar size={16} strokeWidth={1.5} className="text-text-tertiary" />
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setPage(1); setEscPage(1); }}
                className={`text-sm bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-text-primary ${focusRing}`}
              />
              {date ? (
                <button
                  onClick={() => { setDate(""); setPage(1); setEscPage(1); }}
                  className="text-xs text-primary hover:underline px-2 py-1 rounded bg-primary/10"
                >
                  All Dates
                </button>
              ) : (
                <span className="text-xs text-text-tertiary font-medium">All Dates</span>
              )}
            </div>
          }
        />

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-3">
          <button
            onClick={() => setTab("escalations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === "escalations"
                ? "bg-danger/10 text-danger border border-danger/30 font-semibold"
                : "text-text-secondary hover:bg-surface-secondary"
            }`}
          >
            <ShieldAlert size={16} strokeWidth={1.5} />
            <span>Escalations & Attention Feed</span>
            {(escMeta?.total ?? 0) > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-danger text-white font-bold">
                {escMeta?.total}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("activity")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === "activity"
                ? "bg-primary/10 text-primary border border-primary/30 font-semibold"
                : "text-text-secondary hover:bg-surface-secondary"
            }`}
          >
            <Activity size={16} strokeWidth={1.5} />
            <span>General Activity Feed</span>
          </button>
        </div>

        {tab === "escalations" ? (
          <Reveal>
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-danger/15 text-danger">
                  <AlertTriangle size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-subheading text-text-primary">Admin Attention Required</h2>
                  <p className="text-xs text-text-tertiary">Urgent messages, sensitive complaints, or high-risk emails flagged for oversight.</p>
                </div>
                {escMeta && <span className="text-xs text-text-tertiary ml-auto">{escMeta.total} pending</span>}
              </div>

              {escLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-primary" />
                </div>
              ) : escError ? (
                <div className="px-5 py-10 text-center text-sm text-danger">Failed to load escalation items.</div>
              ) : escRows.length === 0 ? (
                <EmptyState
                  title="No pending escalations"
                  description="Great news! There are currently no urgent or sensitive complaints requiring admin intervention."
                />
              ) : (
                <div className="divide-y divide-border">
                  {escRows.map((item) => (
                    <div key={item.id} className="p-5 flex flex-col md:flex-row items-start justify-between gap-4 hover:bg-surface-secondary/20 transition-colors">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={item.severity === "high" ? "danger" : item.severity === "medium" ? "warning" : "muted"}>
                            {item.severity.toUpperCase()} SEVERITY
                          </Badge>
                          {item.analysis?.intent && (
                            <Badge variant="muted">{item.analysis.intent}</Badge>
                          )}
                          {item.analysis?.isUrgent && (
                            <Badge variant="danger">URGENT</Badge>
                          )}
                          <span className="text-xs text-text-tertiary ml-auto md:ml-0">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-text-primary">
                            {item.subject ?? item.reason}
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            Client: <span className="font-medium text-text-primary">{item.client?.name || item.client?.email || "Unknown"}</span> ({item.client?.company || "N/A"})
                            <span className="mx-2">•</span>
                            Received by SE: <span className="font-mono text-text-primary">{item.accountEmail}</span>
                          </div>
                        </div>

                        {item.reason && (
                          <div className="text-xs bg-surface-secondary/60 border border-border rounded p-2.5 text-text-secondary">
                            <strong className="text-text-primary font-medium">AI Urgency / Reason: </strong>
                            {item.reason}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
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
                  ))}
                </div>
              )}

              {escTotalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                  <button
                    onClick={() => setEscPage((p) => Math.max(1, p - 1))}
                    disabled={escPage <= 1}
                    className={`text-xs font-medium text-text-secondary disabled:text-text-tertiary disabled:cursor-not-allowed cursor-pointer ${focusRing}`}
                  >
                    Previous
                  </button>
                  <span className="text-xs text-text-tertiary">Page {escPage} of {escTotalPages}</span>
                  <button
                    onClick={() => setEscPage((p) => Math.min(escTotalPages, p + 1))}
                    disabled={escPage >= escTotalPages}
                    className={`text-xs font-medium text-text-secondary disabled:text-text-tertiary disabled:cursor-not-allowed cursor-pointer ${focusRing}`}
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
        )}
      </div>
    </Shell>
  );
}
