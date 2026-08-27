import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, HelpCircle, Wifi } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { Screen } from "../../types";
import { useAnalyticsSummary, useKnowledgeGaps, useResolveGap, useTeamStats, useTenant } from "../../hooks/queries";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { PageHeader } from "../../components/PageHeader";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { Reveal } from "../../components/Reveal";
import { useToast } from "../../components/Toast";
import { TIER_NAMES } from "../../data/pricingTiers";

type Kpi = { label: string; value: string; sub: string; accent: string };

// KPI card matching the Figma: white surface, #E8E6E0 border, radius 12,
// a 36×3 accent bar on top, 12px label, 28px bold value. Keeps the `sub`
// caption from our data so no information is lost.
function KpiCard({ kpi, delay = 0 }: { kpi: Kpi; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <Card className="px-6 py-5 h-full flex flex-col gap-1.5 shadow-1">
        <span className="w-9 h-[3px] rounded-full" style={{ backgroundColor: kpi.accent }} />
        <div className="text-xs font-medium text-text-tertiary">{kpi.label}</div>
        <div className="text-[28px] font-bold leading-none text-text-primary">{kpi.value}</div>
        <div className="text-xs mt-0.5 text-text-tertiary">{kpi.sub}</div>
      </Card>
    </Reveal>
  );
}

const WINDOW_DAYS = 30;

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40";

type EmailChartPoint = { date: string; emails: number };
type RepChartPoint = { name: string; sent: number };

// recharts renders stroke/fill as SVG presentation attributes, where CSS
// var() does NOT resolve — so read the token values from computed styles
// (and re-read when dark mode toggles the <html class>).
const TOKENS = ["--color-primary", "--color-accent", "--color-border", "--color-text-tertiary", "--color-surface", "--color-text-primary"] as const;
function useChartColors() {
  const read = () => {
    const cs = getComputedStyle(document.documentElement);
    const [primary, accent, border, tick, surface, text] = TOKENS.map(t => cs.getPropertyValue(t).trim() || "#000");
    return { primary, accent, border, tick, surface, text };
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setColors(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return colors;
}

type GapEvidence = {
  subject: string;
  summary: string;
  classification: string | null;
  emailDate: string;
  sender: { name: string | null; email: string; company: string | null };
};

type Gap = {
  id?: string;
  topic: string;
  occurrences: number;
  resolved: boolean;
  tenantId?: string | null;
  createdAt: string;
  updatedAt?: string;
  evidence?: GapEvidence[];
};

function gapTitle(topic: string): string {
  return topic.replace(/[_-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function Analytics({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const c = useChartColors();
  const axisTick = { fontSize: 11, fontFamily: "Inter, sans-serif", fill: c.tick };
  const tooltipStyle = {
    fontSize: 12, fontFamily: "Inter, sans-serif", borderRadius: 8,
    border: `1px solid ${c.border}`, background: c.surface, color: c.text,
  };
  const summary = useAnalyticsSummary(WINDOW_DAYS);
  // Show the admin every real report immediately. Occurrence count still
  // communicates priority; hiding counts 1-2 made "Reported to admin" false.
  const gapsQuery = useKnowledgeGaps(1);
  const teamStatsQuery = useTeamStats();
  const resolveMutation = useResolveGap();
  const tenantQuery = useTenant();

  const team = teamStatsQuery.data ?? [];
  const activeCount = team.filter(m => m.status === "verified").length;
  const invitedCount = team.length;

  const loading = summary.isLoading || gapsQuery.isLoading || teamStatsQuery.isLoading;
  const error = summary.error
    ? (summary.error as Error).message
    : gapsQuery.error
      ? (gapsQuery.error as Error).message
      : teamStatsQuery.error
        ? (teamStatsQuery.error as Error).message
        : null;

  const gaps: Gap[] = Array.isArray(gapsQuery.data) ? gapsQuery.data : [];
  const s = summary.data;

  const emailData: EmailChartPoint[] = s?.dailyCounts ?? [];
  const repData: RepChartPoint[] = team.map(m => ({ name: m.email.split("@")[0], sent: m.repliesSent }));

  // Every figure is built from real data — no static fallback. Past the
  // loading guard, `s` is defined; each field renders "—" rather than a
  // fabricated number when the underlying signal is empty.
  const classEntries = Object.entries(s?.byClassification ?? {});
  const topClass = classEntries.length > 0 ? classEntries.reduce((a, b) => (b[1] > a[1] ? b : a)) : null;
  const total = s?.totalEmailsProcessed ?? 0;
  const reviewed = s?.aiReviewed.count ?? 0;

  // Volume: what came in and what went out.
  const kpiRow1: Kpi[] = s ? [
    { label: "Emails Processed", value: String(total), sub: `in the last ${WINDOW_DAYS} days`, accent: "var(--brand-cyan)" },
    { label: "Replies Sent", value: String(s.replies.threads), sub: s.replies.threads > 0 ? "threads replied" : "no replies yet", accent: "var(--brand-orange)" },
    { label: "Active Sales Engineers", value: String(activeCount), sub: `of ${invitedCount} invited`, accent: "var(--brand-aqua)" },
  ] : [];

  // Quality: how the drafts behaved.
  const kpiRow2: Kpi[] = s ? [
    { label: "Avg Confidence Score", value: reviewed > 0 ? `${Math.round(s.averageConfidence * 100)}%` : "—", sub: reviewed > 0 ? "across AI-reviewed emails" : "no reviewed emails yet", accent: "var(--brand-teal)" },
    { label: "Most Common Type", value: topClass ? topClass[0] : "—", sub: topClass && total > 0 ? `${Math.round((topClass[1] / total) * 100)}% of processed` : "no emails yet", accent: "var(--brand-caramel)" },
    { label: "Escalated to Human", value: reviewed > 0 ? `${Math.round((s.aiReviewed.escalated / reviewed) * 100)}%` : "—", sub: `${s.aiReviewed.escalated} of ${reviewed} AI-reviewed`, accent: "var(--brand-iron)" },
  ] : [];

  const resolvedCount = gaps.filter(g => g.resolved).length;
  const gapSeverity = (occurrences: number) =>
    occurrences >= 12 ? "danger" as const : occurrences >= 8 ? "warning" as const : "muted" as const;

  const resolveGap = (gap: Gap) => {
    if (gap.id) resolveMutation.mutate(gap.id);
    toast(`Marked “${gap.topic}” resolved`);
  };

  const planName = tenantQuery.data?.tier ? TIER_NAMES[tenantQuery.data.tier] : undefined;

  return (
    <Shell active="analytics" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
        <PageHeader title="Analytics" subtitle={`Last ${WINDOW_DAYS} days${planName ? ` · ${planName} plan` : ""}`} />

        {loading ? (
          <div className="py-20 text-center text-sm text-text-tertiary">Loading analytics…</div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-danger">{error}</div>
        ) : <>

        {/* Two rows of three KPIs — white card, #E8E6E0 border, top accent bar */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {kpiRow1.map((k, i) => <KpiCard key={k.label} kpi={k} delay={i * 60} />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {kpiRow2.map((k, i) => <KpiCard key={k.label} kpi={k} delay={i * 60} />)}
        </div>

        {/* Charts — white card, #E8E6E0 border, radius 12, title 15px semibold */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Reveal>
          <Card className="p-5">
            <div className="text-[15px] font-semibold mb-4 text-text-primary">Emails processed over time</div>
            <div className="rounded-lg p-2 bg-surface-secondary">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={emailData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                  <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: c.border }} />
                  <Line type="monotone" dataKey="emails" stroke={c.primary} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          </Reveal>

          <Reveal delay={90}>
          <Card className="p-5">
            <div className="text-[15px] font-semibold mb-4 text-text-primary">Replies per rep</div>
            {repData.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-xs text-text-tertiary">No replies yet</div>
            ) : (
            <div className="rounded-lg p-2 bg-surface-secondary">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={repData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} horizontal={false} />
                  <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={110} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: c.border, fillOpacity: 0.3 }} />
                  <Bar dataKey="sent" fill={c.primary} radius={[0, 4, 4, 0]} name="Replies sent" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
          </Card>
          </Reveal>
        </div>

        {/* Knowledge gaps */}
        <Reveal>
        <Card className="p-5 sm:p-6 mb-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="flex items-center gap-2.5">
              <HelpCircle size={18} strokeWidth={1.5} className="text-text-tertiary" />
              <h2 className="text-base font-semibold text-text-primary">Knowledge Gaps</h2>
            </div>
            <span className="text-xs text-right text-text-tertiary">Questions AI couldn't confidently answer</span>
          </div>

          {gaps.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-2 rounded-full bg-surface-tertiary overflow-hidden">
                <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${(resolvedCount / gaps.length) * 100}%` }} />
              </div>
              <span className="text-xs font-medium text-text-secondary whitespace-nowrap">{resolvedCount} of {gaps.length} resolved</span>
            </div>
          )}

          {gaps.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={20} strokeWidth={1.5} />} title="All gaps resolved" description="No unanswered questions right now — nice work." />
          ) : (
            <div className="divide-y divide-border">
              {gaps.map(g => (
                <div key={g.topic} className={`py-3 transition-opacity duration-300 ${g.resolved ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    {g.resolved
                      ? <CheckCircle2 size={15} strokeWidth={1.5} className="text-success" />
                      : <AlertTriangle size={15} strokeWidth={1.5} className={gapSeverity(g.occurrences) === "danger" ? "text-danger" : gapSeverity(g.occurrences) === "warning" ? "text-warning" : "text-text-tertiary"} />
                    }
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${g.resolved ? "line-through text-text-tertiary" : "text-text-primary"}`}>{gapTitle(g.topic)}</div>
                      <div className="text-xs text-text-tertiary mt-0.5 font-mono">First seen {new Date(g.createdAt).toLocaleString()}</div>
                    </div>
                    <Badge variant={g.resolved ? "success" : gapSeverity(g.occurrences)}>{g.resolved ? "Resolved" : `${g.occurrences} occurrence${g.occurrences === 1 ? "" : "s"}`}</Badge>
                    <button
                      onClick={() => resolveGap(g)}
                      disabled={g.resolved}
                      aria-label={g.resolved ? `"${g.topic}" resolved` : `Mark "${g.topic}" resolved`}
                      title={g.resolved ? "Resolved" : "Mark resolved"}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${g.resolved ? "border-success bg-success/15 text-success cursor-default" : `border-border text-text-tertiary hover:bg-success/15 hover:text-success hover:border-success cursor-pointer ${focusRing}`}`}
                    >
                      <CheckCircle2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>

                  {(g.evidence?.length ?? 0) > 0 && (
                    <div className="ml-7 mt-2 space-y-2">
                      {g.evidence!.map((item, index) => (
                        <div key={`${item.emailDate}-${item.sender.email}-${index}`} className="border-l-2 border-border pl-3 py-1">
                          <div className="text-xs font-medium text-text-primary">{item.subject}</div>
                          <div className="text-xs text-text-tertiary mt-0.5">
                            {item.sender.name || item.sender.email} · {new Date(item.emailDate).toLocaleString()}
                          </div>
                          {item.summary && <div className="text-xs text-text-secondary mt-1">{item.summary.slice(0, 220)}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
        </Reveal>

        {/* Sales Engineer activity */}
        <Reveal>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Wifi size={18} strokeWidth={1.5} className="text-text-tertiary" />
            <div className="flex-1">
              <h2 className="text-base font-semibold text-text-primary">Sales Engineer activity</h2>
              <p className="text-xs text-text-tertiary">Last login and reply rate per rep.</p>
            </div>
          </div>
          {team.length === 0 ? (
            <EmptyState icon={<Wifi size={20} strokeWidth={1.5} />} title="No Sales Engineers yet" description="Invite your team from the Team page." />
          ) : (
            <div className="divide-y divide-border">
              {team.map(m => (
                <div key={m.email} className="flex items-center gap-3 py-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${m.status === "verified" ? "bg-success" : m.status === "granted" ? "bg-warning" : "bg-danger"}`} />
                  <span className="text-sm text-text-primary truncate flex-1">{m.email}</span>
                  <span className="text-xs text-text-tertiary whitespace-nowrap">
                    {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString() : "Never logged in"}
                  </span>
                  <span className="text-xs font-medium text-text-secondary whitespace-nowrap w-24 text-right">
                    {m.emailsReceived > 0 ? `${Math.round(m.replyRate * 100)}% reply rate` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
        </Reveal>

        </>}
      </div>
    </Shell>
  );
}
