import { useState, useEffect } from "react";
import { CheckCircle2, Mail, Send, Users, Gauge, Tag, AlertTriangle, HelpCircle, Wifi } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { ReactNode } from "react";
import type { Screen } from "../../types";
import { useAnalyticsSummary, useKnowledgeGaps, useResolveGap, useTeamStats, useTenant } from "../../hooks/queries";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { StatCard } from "../../components/StatCard";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { Reveal } from "../../components/Reveal";
import { useToast } from "../../components/Toast";

type Kpi = { label: string; value: string; sub: string; subTone?: "success" | "muted"; tone: "blue" | "green" | "amber" | "red"; icon: ReactNode; size?: "md" | "sm" };

const WINDOW_DAYS = 30;
const PLAN_NAMES: Record<number, string> = { 1: "Starter", 2: "Growth", 3: "Enterprise" };

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

type Gap = { id?: string; topic: string; occurrences: number; resolved: boolean; tenantId?: string | null; createdAt: string; updatedAt?: string };

export function Analytics({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const c = useChartColors();
  const axisTick = { fontSize: 11, fontFamily: "Inter, sans-serif", fill: c.tick };
  const tooltipStyle = {
    fontSize: 12, fontFamily: "Inter, sans-serif", borderRadius: 8,
    border: `1px solid ${c.border}`, background: c.surface, color: c.text,
  };
  const summary = useAnalyticsSummary(WINDOW_DAYS);
  const gapsQuery = useKnowledgeGaps();
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

  // Every card is built from real data — no static fallback. Past the loading
  // guard, `s` is defined; each field renders "—" rather than a fabricated
  // number when the underlying signal is empty.
  const momSub = (pct: number | null) =>
    pct === null ? "no previous data" : `${pct >= 0 ? "+" : ""}${pct}% vs previous ${WINDOW_DAYS} days`;

  const classEntries = Object.entries(s?.byClassification ?? {});
  const topClass = classEntries.length > 0 ? classEntries.reduce((a, b) => (b[1] > a[1] ? b : a)) : null;
  const total = s?.totalEmailsProcessed ?? 0;
  const reviewed = s?.aiReviewed.count ?? 0;

  const kpiRow1: Kpi[] = s ? [
    { label: "Emails Processed", value: String(total), sub: momSub(s.momChangePct), subTone: (s.momChangePct ?? 0) >= 0 ? "success" : "muted", tone: "blue", icon: <Mail size={17} strokeWidth={1.5} /> },
    { label: "Replies Sent", value: String(s.replies.threads), sub: s.replies.threads > 0 ? "threads replied" : "no replies yet", tone: "green", icon: <Send size={17} strokeWidth={1.5} /> },
    { label: "Active Sales Engineers", value: String(activeCount), sub: `of ${invitedCount} invited`, tone: activeCount > 0 ? "green" : "red", icon: <Users size={17} strokeWidth={1.5} /> },
  ] : [];

  const kpiRow2: Kpi[] = s ? [
    { label: "Avg Confidence Score", value: reviewed > 0 ? `${Math.round(s.averageConfidence * 100)}%` : "—", sub: reviewed > 0 ? "across AI-reviewed emails" : "no reviewed emails yet", subTone: "success", tone: "blue", icon: <Gauge size={17} strokeWidth={1.5} />, size: "sm" },
    { label: "Most Common Type", value: topClass ? topClass[0] : "—", sub: topClass && total > 0 ? `${Math.round((topClass[1] / total) * 100)}% of processed` : "no emails yet", tone: "green", icon: <Tag size={17} strokeWidth={1.5} />, size: "sm" },
    { label: "Escalated to Human", value: reviewed > 0 ? `${Math.round((s.aiReviewed.escalated / reviewed) * 100)}%` : "—", sub: `${s.aiReviewed.escalated} of ${reviewed} AI-reviewed`, tone: "amber", icon: <AlertTriangle size={17} strokeWidth={1.5} />, size: "sm" },
  ] : [];

  const resolvedCount = gaps.filter(g => g.resolved).length;
  const gapSeverity = (occurrences: number) =>
    occurrences >= 12 ? "danger" as const : occurrences >= 8 ? "warning" as const : "muted" as const;

  const resolveGap = (gap: Gap) => {
    if (gap.id) resolveMutation.mutate(gap.id);
    toast(`Marked “${gap.topic}” resolved`);
  };

  const planName = tenantQuery.data?.tier ? PLAN_NAMES[tenantQuery.data.tier] : undefined;

  return (
    <Shell active="analytics" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader title="Analytics" subtitle={`Last ${WINDOW_DAYS} days${planName ? ` · ${planName} plan` : ""}`} />

        {loading ? (
          <div className="py-20 text-center text-sm text-text-tertiary">Loading analytics…</div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-danger">{error}</div>
        ) : <>

        {/* 6 KPI cards — two rows of 3 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {kpiRow1.map((k, i) => (
            <Reveal key={k.label} delay={i * 70} className="h-full">
              <StatCard {...k} />
            </Reveal>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {kpiRow2.map((k, i) => (
            <Reveal key={k.label} delay={i * 70} className="h-full">
              <StatCard {...k} />
            </Reveal>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <Reveal className="lg:col-span-2">
          <Card className="p-5 transition-transform duration-300 hover:-translate-y-1">
            <div className="font-display text-[15px] font-semibold text-text-primary mb-4 tracking-tight">Emails processed over time</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={emailData}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: c.border }} />
                <Line type="monotone" dataKey="emails" stroke={c.primary} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          </Reveal>

          <Reveal delay={90}>
          <Card className="p-5 transition-transform duration-300 hover:-translate-y-1">
            <div className="font-display text-[15px] font-semibold text-text-primary mb-4 tracking-tight">Replies per rep</div>
            {repData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-text-tertiary">No replies yet</div>
            ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={repData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={c.border} horizontal={false} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: c.border, fillOpacity: 0.3 }} />
                <Bar dataKey="sent" fill={c.primary} radius={[0, 4, 4, 0]} name="Replies sent" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </Card>
          </Reveal>
        </div>

        {/* Knowledge gaps */}
        <Reveal>
        <Card className="p-5 mb-5 transition-transform duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-warning) 14%, transparent)" }}>
                <HelpCircle size={18} strokeWidth={1.5} className="text-warning" />
              </div>
              <h2 className="text-subheading text-text-primary">Knowledge gaps</h2>
            </div>
            <span className="text-xs text-text-tertiary text-right">Questions AI couldn't confidently answer</span>
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
                <div key={g.topic} className={`flex items-center gap-3 py-3 flex-wrap transition-opacity duration-300 ${g.resolved ? "opacity-60" : ""}`}>
                  {g.resolved
                    ? <CheckCircle2 size={15} strokeWidth={1.5} className="text-success" />
                    : <AlertTriangle size={15} strokeWidth={1.5} className={gapSeverity(g.occurrences) === "danger" ? "text-danger" : gapSeverity(g.occurrences) === "warning" ? "text-warning" : "text-text-tertiary"} />
                  }
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium ${g.resolved ? "line-through text-text-tertiary" : "text-text-primary"}`}>{g.topic}</div>
                    <div className="text-xs text-text-tertiary mt-0.5 font-mono">First seen {g.createdAt}</div>
                  </div>
                  <Badge variant={g.resolved ? "success" : gapSeverity(g.occurrences)}>{g.resolved ? "Resolved" : `${g.occurrences} occurrences`}</Badge>
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
              ))}
            </div>
          )}
        </Card>
        </Reveal>

        {/* Sales Engineer activity */}
        <Reveal>
        <Card className="p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-text-tertiary) 14%, transparent)" }}>
              <Wifi size={18} strokeWidth={1.5} className="text-text-tertiary" />
            </div>
            <div className="flex-1">
              <h2 className="text-subheading text-text-primary">Sales Engineer activity</h2>
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
                  <span className="text-[13px] text-text-primary truncate flex-1">{m.email}</span>
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
