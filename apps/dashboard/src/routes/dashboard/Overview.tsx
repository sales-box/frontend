import { useEffect } from "react";
import { BookOpen, Users, Link2, BarChart2, ChevronRight, CheckCircle2 } from "lucide-react";
import type { Screen } from "../../types";
import { Shell } from "../../components/Shell";
import { PageHeader } from "../../components/PageHeader";
import { Reveal } from "../../components/Reveal";
import { useDocuments, useTenant, useCrmStatus } from "../../hooks/queries";
import { useAuthStore } from "../../store/auth";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40";

function cardKeyDown(fn: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
  };
}

export function Overview({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const kb = useDocuments(1, 1);
  const tenant = useTenant();
  const crmStatus = useCrmStatus();

  const status = {
    docs: (kb.data?.meta?.total ?? 0) > 0,
    team: tenant.data?.status === "active",
    crm: crmStatus.data?.connected ?? false,
  };
  const loading = kb.isLoading || tenant.isLoading || crmStatus.isLoading;

  const setCompany = useAuthStore(s => s.setCompany);
  useEffect(() => {
    if (tenant.data?.companyName) setCompany(tenant.data.companyName);
  }, [tenant.data?.companyName, setCompany]);

  const steps = [
    { icon: <BookOpen size={20} strokeWidth={1.5} className="text-accent-cool" />, title: "Upload your first document",
      desc: "Add product docs, FAQs, or pricing sheets so the AI has accurate knowledge to draw from.",
      action: "Go to Knowledge Base", target: "knowledge-base" as Screen, step: "Step 1", done: status.docs },
    { icon: <Users size={20} strokeWidth={1.5} className="text-accent-cool" />, title: "Invite your first Sales Engineer",
      desc: "Add team members so they can access AI suggestions inside Gmail.",
      action: "Go to Team", target: "team" as Screen, step: "Step 2", done: status.team },
  ];
  const completed = steps.filter(s => s.done).length;

  return (
    <Shell active="overview" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader title="Welcome to Inbox Sales Copilot" subtitle="Complete setup to start using AI-assisted replies." />

        {/* Setup progress */}
        <Reveal>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-text-primary">Setup progress</span>
            <span className="text-[13px] text-text-tertiary">
              {loading ? "Checking…" : `${completed} of ${steps.length} complete`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden">
            <div className="h-1.5 bg-accent-cool rounded-full transition-all duration-500" style={{ width: loading ? "0%" : `${(completed / steps.length) * 100}%` }} />
          </div>
        </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {steps.map((card, i) => (
            <Reveal key={card.title} delay={i * 70}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onNav(card.target)}
              onKeyDown={cardKeyDown(() => onNav(card.target))}
              className={`text-left bg-surface border rounded-lg p-6 flex flex-col gap-4 hover:border-secondary/50 transition-colors cursor-pointer ${card.done ? "border-success/40" : "border-border"} ${focusRing}`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-md bg-accent-cool-light flex items-center justify-center">{card.icon}</div>
                <div className="flex items-center gap-2">
                  <span className="text-eyebrow">{card.step}</span>
                  {card.done && <CheckCircle2 size={14} strokeWidth={1.5} className="text-success" />}
                </div>
              </div>
              <div>
                <h2 className="text-subheading text-text-primary mb-1">{card.title}</h2>
                <p className="text-body text-text-secondary">{card.desc}</p>
              </div>
              <span className="flex items-center gap-1 text-[13px] font-medium text-accent-cool mt-auto">
                {card.done ? "View" : card.action} <ChevronRight size={13} strokeWidth={1.5} />
              </span>
            </div>
            </Reveal>
          ))}
        </div>

        <div className="mb-3"><span className="text-eyebrow">Optional</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: <Link2 size={17} strokeWidth={1.5} className={status.crm ? "text-success" : "text-text-tertiary"} />, title: "Connect your CRM", desc: status.crm ? "HubSpot connected." : "Sync HubSpot for richer client history context.", target: "crm" as Screen, done: status.crm },
            { icon: <BarChart2 size={17} strokeWidth={1.5} className="text-text-tertiary" />, title: "View analytics", desc: "See how your team is using AI replies.", target: "analytics" as Screen, done: false },
          ].map((card, i) => (
            <Reveal key={card.title} delay={i * 70}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onNav(card.target)}
              onKeyDown={cardKeyDown(() => onNav(card.target))}
              className={`text-left bg-surface border rounded-lg p-5 flex items-start gap-3.5 hover:border-secondary/40 transition-colors cursor-pointer ${card.done ? "border-success/40" : "border-border"} ${focusRing}`}
            >
              <div className="w-9 h-9 rounded-md bg-surface-secondary flex items-center justify-center shrink-0">{card.icon}</div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-text-primary mb-0.5">{card.title}</h2>
                <p className="text-xs text-text-tertiary leading-relaxed">{card.desc}</p>
              </div>
              {card.done ? <CheckCircle2 size={14} strokeWidth={1.5} className="text-success mt-0.5 shrink-0" /> : <ChevronRight size={14} strokeWidth={1.5} className="text-text-tertiary mt-0.5 shrink-0" />}
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Shell>
  );
}
