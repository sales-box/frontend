import { useEffect } from "react";
import { BookOpen, Users, Link2, ArrowRight } from "lucide-react";
import type { Screen } from "../../types";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { PageHeader } from "../../components/PageHeader";
import { Reveal } from "../../components/Reveal";
import {
  useTenant, useTeamStats, useKnowledgeGaps,
  useAnalyticsSummary, useActivityFeed,
} from "../../hooks/queries";
import { useAuthStore } from "../../store/auth";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40";

// KPI accent colours — theme vars so they mute in dark mode
const KPI_ACCENT = {
  cyan: "var(--brand-cyan)",
  orange: "var(--brand-orange)",
  iron: "var(--brand-iron)",
  aqua: "var(--brand-aqua)",
};

function fmt(n: number | undefined | null) {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

// Map an activity classification to a coloured dot
function dotColor(classification: string | null): string {
  switch (classification) {
    case "reply_sent": case "answered": return "#0A9396";
    case "escalation": case "low_confidence": case "unanswered": return "#AE2012";
    case "upgrade_query": case "pricing": return "#CA6702";
    default: return "#005F73";
  }
}

export function Overview({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const tenant = useTenant();
  const teamStats = useTeamStats();
  const summary = useAnalyticsSummary(30);
  const gaps = useKnowledgeGaps(3);
  const activity = useActivityFeed(1, 6);

  const user = useAuthStore(s => s.user);
  const setCompany = useAuthStore(s => s.setCompany);
  useEffect(() => {
    if (tenant.data?.companyName) setCompany(tenant.data.companyName);
  }, [tenant.data?.companyName, setCompany]);

  const activeSEs = (teamStats.data ?? []).filter(m => m.status !== "revoked").length;
  const openGaps = (gaps.data ?? []).filter(g => !g.resolved).length;
  const s = summary.data;

  const kpis = [
    { label: "Emails Processed", value: fmt(s?.totalEmailsProcessed), accent: KPI_ACCENT.cyan },
    { label: "Replies Sent", value: fmt(s?.replies?.threads), accent: KPI_ACCENT.orange },
    { label: "Knowledge Gaps", value: fmt(openGaps), accent: KPI_ACCENT.iron },
    { label: "Active SEs", value: fmt(activeSEs), accent: KPI_ACCENT.aqua },
  ];

  const actions = [
    { title: "Upload Knowledge", desc: "Add docs, FAQs & pricing", icon: <BookOpen size={20} strokeWidth={1.75} />, target: "knowledge-base" as Screen, bg: "var(--brand-teal)", fg: "#FFFFFF", sub: "rgba(255,255,255,0.75)" },
    { title: "Invite Team", desc: "Add your sales engineers", icon: <Users size={20} strokeWidth={1.75} />, target: "team" as Screen, bg: "var(--brand-orange)", fg: "var(--on-warm)", sub: "rgba(0,18,25,0.65)" },
    { title: "Connect CRM", desc: "Sync HubSpot or Zoho", icon: <Link2 size={20} strokeWidth={1.75} />, target: "crm" as Screen, bg: "var(--brand-wheat)", fg: "var(--on-warm)", sub: "rgba(0,18,25,0.6)" },
  ];

  const items = activity.data?.data ?? [];

  return (
    <Shell active="overview" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
        <PageHeader
          title="Overview"
          subtitle={`Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        />

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((k, i) => (
            <Reveal key={k.label} delay={i * 60}>
              <Card className="px-6 py-5 flex flex-col gap-1.5 shadow-1">
                {/* top accent bar — matches Analytics KPI cards */}
                <span className="w-9 h-[3px] rounded-full" style={{ backgroundColor: k.accent }} />
                <div className="text-xs font-medium text-text-tertiary">{k.label}</div>
                <div className="text-[28px] font-bold leading-none text-text-primary">{k.value}</div>
              </Card>
            </Reveal>
          ))}
        </div>

        {/* Action cards — brand backgrounds work in both themes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {actions.map((a, i) => (
            <Reveal key={a.title} delay={i * 70}>
              <button
                onClick={() => onNav(a.target)}
                className={`group w-full text-left rounded-xl p-5 flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer ${focusRing}`}
                style={{ backgroundColor: a.bg, color: a.fg }}
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
                >
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold">{a.title}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: a.sub }}>{a.desc}</div>
                </div>
                <ArrowRight size={18} strokeWidth={2} className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </Reveal>
          ))}
        </div>

        {/* Recent Activity */}
        <Reveal>
          <Card>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-[15px] font-semibold text-text-primary">Recent Activity</h2>
              <button
                onClick={() => onNav("activity-feed")}
                className={`text-[14px] font-medium flex items-center gap-1 cursor-pointer rounded text-primary hover:text-primary-hover ${focusRing}`}
              >
                View all <ArrowRight size={13} strokeWidth={2} />
              </button>
            </div>

            <div className="divide-y divide-border">
              {activity.isLoading ? (
                <div className="px-6 py-8 text-center text-[14px] text-text-tertiary">Loading activity…</div>
              ) : items.length === 0 ? (
                <div className="px-6 py-8 text-center text-[14px] text-text-tertiary">No activity yet.</div>
              ) : (
                items.map((it, idx) => (
                  <div key={it.id ?? idx} className="flex items-center gap-3.5 px-6 py-3.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dotColor(it.classification) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] truncate text-text-primary">
                        <span className="font-medium">{it.client}</span>
                        {it.company ? ` · ${it.company}` : ""}
                        {it.action ? ` — ${it.action}` : ""}
                      </p>
                    </div>
                    {it.time && (
                      <span className="text-[12px] flex-shrink-0 text-text-tertiary">{it.time}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </Reveal>
      </div>
    </Shell>
  );
}
