import { Inbox, ArrowRight, Check, BookOpen, TrendingUp, Activity, Send } from "lucide-react";
import type { Screen } from "../types";
import { Btn } from "../components/Btn";
import { Reveal } from "../components/Reveal";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-sm";
const GRAIN = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-eyebrow">{children}</span>
      <span className="h-px flex-1 max-w-[7rem] bg-border" />
    </div>
  );
}

export function Landing({ onNav }: { onNav: (s: Screen) => void }) {
  const tiers = [
    { name: "Starter", price: "$49", period: "/mo", seats: "Up to 3 Sales Engineers", docs: "25 documents",
      features: ["AI reply suggestions", "Knowledge Base upload", "Basic analytics"], highlight: false },
    { name: "Growth", price: "$149", period: "/mo", seats: "Up to 10 Sales Engineers", docs: "200 documents",
      features: ["Everything in Starter", "CRM integration", "Advanced analytics", "Priority support"], highlight: true },
    { name: "Enterprise", price: "Custom", period: "", seats: "Unlimited seats", docs: "Unlimited documents",
      features: ["Everything in Growth", "SSO / SAML", "Dedicated CSM", "SLA guarantee"], highlight: false },
  ];
  const features = [
    { n: "01", icon: <BookOpen size={17} strokeWidth={1.5} className="text-accent" />, title: "Knowledge-grounded replies",
      desc: "Upload product docs once. Every AI reply cites your actual materials — never a hallucination." },
    { n: "02", icon: <TrendingUp size={17} strokeWidth={1.5} className="text-accent" />, title: "Dual confidence scores",
      desc: "Product knowledge and client history, scored separately — so reps know exactly when to review." },
    { n: "03", icon: <Activity size={17} strokeWidth={1.5} className="text-accent" />, title: "Knowledge-gap analytics",
      desc: "See the questions your reps can't answer yet, and which documents need updating." },
  ];
  const stats = [
    { v: "200+", l: "B2B companies onboard" },
    { v: "67%", l: "replies sent as-is" },
    { v: "4.8", l: "average G2 rating" },
    { v: "SOC 2", l: "Type II certified" },
  ];

  return (
    <div className="min-h-[100dvh] bg-surface font-body text-text-primary">
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
              <Inbox size={14} strokeWidth={1.5} className="text-text-on-primary" />
            </div>
            <span className="font-display text-[15px] text-text-primary truncate">Inbox Sales Copilot</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Btn variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => onNav("signin")}>Sign in</Btn>
            <Btn variant="primary" size="sm" onClick={() => onNav("signup")}>Register</Btn>
          </div>
        </div>
      </header>

      {/* HERO — each element reveals on its own, staggered */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 md:pt-24 pb-16 md:pb-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          <div className="lg:col-span-7">
            <Reveal><Eyebrow>01 — AI email intelligence for B2B sales</Eyebrow></Reveal>
            <Reveal delay={90}>
              <h1 className="font-display text-[2.75rem] sm:text-[4rem] lg:text-[5.25rem] leading-[0.95] tracking-[-0.02em] text-text-primary">
                Reply <em className="italic text-accent">smarter.</em><br />Close faster.
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="dropcap text-[1.0625rem] leading-[1.7] text-text-secondary max-w-[34rem] mt-7">
                Inbox Sales Copilot surfaces AI-drafted replies right inside Gmail — grounded in your product
                knowledge and client history, so your Sales Engineers spend less time writing and more time selling.
              </p>
            </Reveal>
            <Reveal delay={270}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Btn variant="primary" size="lg" className="w-full sm:w-auto group" onClick={() => onNav("signup")}>
                  Register your company
                  <ArrowRight size={15} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
                </Btn>
                <Btn variant="secondary" size="lg" className="w-full sm:w-auto">See a demo</Btn>
              </div>
            </Reveal>
            <Reveal delay={360}>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-text-tertiary">
                {["Trusted by 200+ B2B companies", "4.8 / 5 on G2", "SOC 2 Type II"].map((t, i) => (
                  <div key={t} className="flex items-center gap-6">
                    {i > 0 && <span className="h-3 w-px bg-border hidden sm:block" />}
                    <span className="flex items-center gap-1.5"><Check size={13} strokeWidth={2} className="text-accent" /> {t}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={220} className="lg:col-span-5">
            <div className="border border-border rounded-lg bg-surface overflow-hidden transition-transform duration-300 hover:-translate-y-1">
              <div className="px-5 py-3 border-b border-border bg-surface-tertiary flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-accent text-xs font-semibold flex-shrink-0">M</div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-text-primary truncate">Marcus Reid</div>
                    <div className="text-xs text-text-tertiary truncate">Brightwave Technologies</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-success-light text-success whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />Active deal
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-eyebrow mb-2">AI confidence</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-success-light text-success"><span className="w-1.5 h-1.5 rounded-full bg-success" />Product 82%</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-warning-light text-warning"><span className="w-1.5 h-1.5 rounded-full bg-warning" />History 65%</span>
                  </div>
                </div>
                <div>
                  <div className="text-eyebrow mb-2">Suggested reply</div>
                  <p className="font-display italic text-[13.5px] leading-[1.6] text-text-secondary border-l-2 border-accent pl-3.5">
                    "Great news — our Enterprise tier supports configurable 7-year retention, fully GDPR-compliant for your EU entities."
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 bg-primary text-text-on-primary text-xs font-semibold px-3 py-1.5 rounded-sm"><Send size={11} strokeWidth={1.5} /> Send</span>
                  <span className="text-xs text-text-tertiary">or edit in Gmail</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* INK BAND — manifesto + stats, staggered */}
      <section className="relative bg-primary text-text-on-primary overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("${GRAIN}")` }} />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-20 md:py-24">
          <Reveal><div className="text-eyebrow text-text-on-primary/50 mb-7">02 — Why teams switch</div></Reveal>
          <Reveal delay={100}>
            <p className="font-display text-[1.75rem] sm:text-[2.5rem] lg:text-[2.9rem] leading-[1.15] tracking-[-0.01em] max-w-[46rem] text-text-on-primary">
              Every reply, grounded in your <em className="italic text-accent">own product truth</em> — no hallucinations, no guesswork, no cold-start.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 mt-14 pt-10 border-t border-text-on-primary/15">
            {stats.map((s, i) => (
              <Reveal key={s.l} delay={i * 110}>
                <div className="font-display text-[2.25rem] sm:text-[2.75rem] leading-none text-text-on-primary">{s.v}</div>
                <div className="text-[13px] text-text-on-primary/60 mt-2 leading-snug">{s.l}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — separate cards so each reveals + lifts on its own */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 md:py-24">
        <Reveal><Eyebrow>03 — What it does</Eyebrow></Reveal>
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 120} className="h-full">
              <div className="group h-full bg-surface border border-border rounded-lg p-7 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40">
                <div className="flex items-baseline justify-between mb-6">
                  <div className="w-9 h-9 rounded-md bg-accent-light flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-0.5">{f.icon}</div>
                  <span className="font-display text-2xl text-text-tertiary/60 transition-colors duration-300 group-hover:text-accent">{f.n}</span>
                </div>
                <h3 className="text-subheading text-text-primary mb-2">{f.title}</h3>
                <p className="text-body text-text-secondary">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PRICING — each tier reveals on its own */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
        <Reveal><Eyebrow>04 — Pricing</Eyebrow></Reveal>
        <Reveal delay={60}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-10">
            <h2 className="font-display text-[2rem] sm:text-[2.5rem] leading-tight tracking-[-0.015em] text-text-primary">
              Simple, <em className="italic text-accent">transparent</em> pricing
            </h2>
            <p className="text-body text-text-secondary sm:pb-2">14-day free trial · no credit card required</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 120} className="h-full">
              <div
                className={`relative h-full rounded-lg border p-6 flex flex-col gap-4 transition-transform duration-300 hover:-translate-y-1.5 ${
                  tier.highlight ? "bg-primary border-primary" : "bg-surface border-border"
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-2.5 left-6 text-[10px] font-semibold tracking-[0.08em] uppercase bg-accent text-white px-2.5 py-1 rounded-full">Most popular</span>
                )}
                <div>
                  <div className={`text-eyebrow mb-1 ${tier.highlight ? "text-text-on-primary/75" : ""}`}>{tier.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display text-[2.75rem] leading-none ${tier.highlight ? "text-text-on-primary" : "text-text-primary"}`}>{tier.price}</span>
                    {tier.period && <span className={`text-sm ${tier.highlight ? "text-text-on-primary/75" : "text-text-tertiary"}`}>{tier.period}</span>}
                  </div>
                </div>
                <div className={`text-xs leading-relaxed ${tier.highlight ? "text-text-on-primary/80" : "text-text-tertiary"}`}>
                  <div>{tier.seats}</div><div>{tier.docs}</div>
                </div>
                <ul className="space-y-2 flex-1 pt-1">
                  {tier.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-[13px] ${tier.highlight ? "text-text-on-primary" : "text-text-primary"}`}>
                      <Check size={12} strokeWidth={2.5} className={tier.highlight ? "text-text-on-primary/75" : "text-accent"} /> {f}
                    </li>
                  ))}
                </ul>
                <Btn variant={tier.highlight ? "inverse" : "primary"} className="w-full justify-center" onClick={() => onNav("signup")}>
                  {tier.name === "Enterprise" ? "Contact sales" : "Get started"}
                </Btn>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Inbox size={14} strokeWidth={1.5} className="text-text-on-primary" />
            </div>
            <span className="font-display text-[15px] text-text-primary">Inbox Sales Copilot</span>
          </div>
          <div className="flex flex-wrap gap-5 text-xs text-text-tertiary">
            {["Privacy", "Terms", "Security", "© 2026 Inbox Sales Copilot, Inc."].map(l => (
              <a key={l} href="#" className={`hover:text-text-primary transition-colors ${focusRing}`}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
