import { useState, useEffect } from "react";
import { ChevronRight, Check, BookOpen, TrendingUp, Activity, Menu, X, Mail, Link2, Play } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import type { Screen } from "../types";
import { Btn } from "../components/Btn";
import { Reveal } from "../components/Reveal";
import { CountUp } from "../components/CountUp";
import { AccordionItem } from "../components/Accordion";
import { ThemeToggle } from "../components/ThemeToggle";
import { PRICING_TIERS } from "../data/pricingTiers";
import mascotIconSilhouette from "../assets/mascot-icon-silhouette.svg";

function EyebrowDark({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#94D2BD]">{children}</span>
      <span className="h-px flex-1 max-w-[7rem] bg-white/20" />
    </div>
  );
}

function EyebrowLight({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-text-tertiary">{children}</span>
    </div>
  );
}

export function Landing({ onNav }: { onNav: (s: Screen) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [location.hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ENTERPRISE_CONTACT = "admin-sales@salesbox.dev";

  const stats = [
    { v: "0", l: "replies sent without a human" },
    { v: "2", l: "confidence scores per draft" },
    { v: "100%", l: "of claims cited to your docs" },
  ];

  return (
    <div className="min-h-[100dvh] font-body">

      {/* ─── NAVBAR (dark, full-width) ─── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#001219]/95 backdrop-blur-md shadow-lg" : "bg-[#001219]"
      }`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#005F73] flex items-center justify-center flex-shrink-0">
              <img src={mascotIconSilhouette} alt="" className="w-4.5 h-4.5 brightness-0 invert" aria-hidden="true" />
            </div>
            <span className="font-display text-[15px] font-semibold text-white tracking-tight truncate">SalesBox</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-white/70">
            {[
              { id: "features", label: "Features" },
              { id: "how-it-works", label: "How it works" },
              { id: "pricing", label: "Pricing" },
              { id: "faq", label: "FAQ" }
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="relative py-1.5 hover:text-white transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 flex-shrink-0">
            <ThemeToggle variant="standard" className="hidden md:flex [&_svg]:text-white/60" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
            <button onClick={() => onNav("signin")} className="hidden sm:inline-flex text-[13px] font-semibold text-white/80 hover:text-white transition-colors px-3 py-1.5 cursor-pointer">
              Sign in
            </button>
            <button
              onClick={() => onNav("signup")}
              className="bg-[#EE9B00] hover:bg-[#CA6702] text-[#001219] text-[13px] font-bold px-5 py-2 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-px cursor-pointer shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#001219]/95 backdrop-blur-md border-t border-white/10 p-4 flex flex-col gap-1.5 z-50 md:hidden">
            {[
              { id: "features", label: "Features" },
              { id: "how-it-works", label: "How it works" },
              { id: "pricing", label: "Pricing" },
              { id: "faq", label: "FAQ" }
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                  setMobileMenuOpen(false);
                }}
              >
                {item.label}
              </a>
            ))}
            <hr className="border-white/10 my-1" />
            <a
              href="#signin"
              className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); onNav("signin"); }}
            >
              Sign in
            </a>
          </div>
        )}
      </header>

      {/* ─── HERO (dark Ink Black bg) ─── */}
      <section className="relative w-full bg-[#001219] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#005F73]/10 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-32 md:pt-44 pb-20 md:pb-28 text-center">
          <Reveal delay={90}>
            <h1 className="font-display text-[2.5rem] sm:text-[3.5rem] lg:text-[4.5rem] leading-[1.05] tracking-[-0.02em] text-white mb-6">
              Close Deals Faster<br />
              With AI-Powered Email<br />
              Intelligence
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="text-[1.0625rem] leading-[1.7] text-white/60 max-w-[38rem] mx-auto mb-10">
              SalesBox reads every inbound email, drafts context-aware replies,
              and surfaces the insights your team needs — before the meeting starts.
            </p>
          </Reveal>
          <Reveal delay={270}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center justify-center gap-2 bg-transparent border border-white/20 hover:border-white/40 text-white text-[15px] font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <Play size={14} strokeWidth={2} className="fill-white" />
                Watch Demo
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── SOCIAL PROOF / PRODUCT FACTS ─── */}
      <section className="w-full py-14 bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-8">
            <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-text-tertiary">Trusted by teams at</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {stats.map((s, i) => (
              <Reveal key={s.l} delay={i * 110}>
                <div className="font-display text-[2.25rem] sm:text-[2.75rem] leading-none text-text-primary">
                  <CountUp value={s.v} />
                </div>
                <div className="text-[13px] text-text-secondary mt-2 leading-snug">{s.l}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES (dark teal bg) ─── */}
      <section id="features" className="relative w-full bg-[#005F73] overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><EyebrowDark>Features</EyebrowDark></Reveal>
          <Reveal delay={60}>
            <h2 className="font-display text-[2rem] sm:text-[2.5rem] leading-tight tracking-[-0.015em] text-white mb-3">
              Everything your Sales Engineers need
            </h2>
            <p className="text-[15px] text-white/60 max-w-xl mb-14">
              From inbox to close — one platform for email intelligence, knowledge, and team coordination.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Smart Email Classification",
                desc: "Every email is automatically classified by intent, urgency, and topic — so your team knows what needs attention first."
              },
              {
                icon: TrendingUp,
                title: "AI Draft Replies",
                desc: "Context-aware reply suggestions pulled from your knowledge base. Review, edit, and send — hit better response times."
              },
              {
                icon: Activity,
                title: "Team Analytics",
                desc: "See who's responding, what's being asked, and where knowledge gaps live. Data your team actually uses."
              }
            ].map((feat, i) => (
              <Reveal key={feat.title} delay={i * 120}>
                <div className="h-full bg-[#004E5F] hover:bg-[#00414F] border border-white/10 rounded-2xl p-7 transition-colors duration-200">
                  <div className="mb-5 w-10 h-10 rounded-xl bg-[#94D2BD]/20 flex items-center justify-center">
                    <feat.icon size={20} strokeWidth={1.5} className="text-[#94D2BD]" />
                  </div>
                  <h3 className="text-[17px] font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-[13px] text-white/60 leading-relaxed">{feat.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="relative w-full overflow-hidden bg-surface">
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><EyebrowLight>How it works</EyebrowLight></Reveal>
          <Reveal delay={60}>
            <h2 className="font-display text-[2rem] sm:text-[2.5rem] leading-tight tracking-[-0.015em] text-text-primary text-center mb-16">
              Up and running in <em className="text-[#0A9396] not-italic">minutes</em>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {[
              { num: "01", title: "Connect Gmail", desc: "Sign in with Google. The extension installs directly into your inbox, no separate app to check." },
              { num: "02", title: "Upload your knowledge", desc: "Product docs, pricing sheets, past proposals — the AI grounds every reply in what you upload, nothing invented." },
              { num: "03", title: "AI drafts the reply", desc: "Open a client email in Gmail and a context-aware draft appears in the sidebar, with a confidence score." },
              { num: "04", title: "You review and send", desc: "Every reply is reviewed by a Sales Engineer before it goes out. Nothing sends automatically — ever." }
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 120} variant={i % 2 === 0 ? "left" : "right"} className="group relative flex flex-col items-start">
                {i < 3 && (
                  <div aria-hidden className="hidden md:flex absolute top-7 left-16 -right-8 items-center z-0">
                    <div className="h-px flex-1 bg-border" />
                    <ChevronRight size={14} strokeWidth={2.5} className="text-[#0A9396]/40 -ml-1 flex-shrink-0" />
                  </div>
                )}
                <div className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0A9396]/25 bg-surface">
                  <span className="font-display text-xl font-bold text-[#005F73]">{step.num}</span>
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2 z-10">{step.title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed z-10">{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTEGRATIONS ─── */}
      <section id="integrations" className="relative w-full overflow-hidden bg-surface-secondary">
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><EyebrowLight>Integrations</EyebrowLight></Reveal>
          <Reveal delay={60}>
            <h2 className="font-display text-[2rem] sm:text-[2.5rem] leading-tight tracking-[-0.015em] text-text-primary text-center mb-14">
              Works with your <em className="text-[#0A9396] not-italic">existing</em> stack
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Gmail", desc: "Native inbox sidebar", status: "Supported", icon: Mail },
              { name: "HubSpot", desc: "Two-way CRM sync", status: "Available", icon: Link2 },
              { name: "Zoho", desc: "Two-way CRM sync", status: "Available", icon: Link2 }
            ].map((int, i) => (
              <Reveal key={int.name} delay={i * 120} variant="scale" className="h-full">
                <div className="group relative h-full bg-surface border border-border hover:border-[#0A9396]/40 rounded-2xl p-7 flex flex-col justify-between gap-6 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#005F73]/10 flex items-center justify-center">
                      <int.icon size={20} strokeWidth={1.5} className="text-[#005F73]" />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                      int.status === "Supported"
                        ? "bg-[#0A9396]/10 text-[#0A9396]"
                        : "bg-surface-tertiary text-text-tertiary"
                    }`}>
                      {int.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-1">{int.name}</h3>
                    <p className="text-[13px] text-text-secondary">{int.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="relative w-full overflow-hidden bg-surface">
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><EyebrowLight>Pricing</EyebrowLight></Reveal>
          <Reveal delay={60}>
            <h2 className="font-display text-[2rem] sm:text-[2.5rem] leading-tight tracking-[-0.015em] text-text-primary text-center mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-[15px] text-text-secondary text-center mb-14">No hidden fees. Cancel anytime.</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {PRICING_TIERS.map((tier, i) => {
              const isFeatured = tier.highlight;
              return (
                <Reveal key={tier.name} delay={i * 120} className="h-full">
                  <div className={`group relative h-full rounded-2xl flex flex-col overflow-hidden ${
                    isFeatured
                      ? "scale-100 md:scale-105 z-10 shadow-xl"
                      : "border border-border"
                  }`}>
                    <div className={`h-full p-8 flex flex-col justify-between relative ${
                      isFeatured
                        ? "bg-[#001219] text-white"
                        : "bg-surface"
                    }`}>
                      {isFeatured && (
                        <span className="absolute top-4 right-4 text-[10px] font-bold tracking-[0.08em] uppercase bg-[#EE9B00] text-[#001219] px-3 py-1 rounded-full shadow-sm">
                          Most Popular
                        </span>
                      )}

                      <div className="flex-1 flex flex-col gap-6">
                        <div>
                          <h3 className={`font-display text-xs font-bold tracking-[0.08em] uppercase mb-2 ${
                            isFeatured ? "text-[#94D2BD]" : "text-text-tertiary"
                          }`}>
                            {tier.name}
                          </h3>
                          <div className="flex items-baseline gap-1.5">
                            <span className={`font-display text-[3.25rem] font-bold leading-none tracking-tight ${
                              isFeatured ? "text-white" : "text-text-primary"
                            }`}>
                              {tier.priceLabel}
                            </span>
                            {tier.period && (
                              <span className={`text-sm font-medium ${isFeatured ? "text-white/50" : "text-text-tertiary"}`}>
                                {tier.period}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={`text-xs font-semibold leading-relaxed border-y py-4 flex flex-col gap-1.5 ${
                          isFeatured ? "border-white/15 text-white/70" : "border-border text-text-secondary"
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isFeatured ? "bg-[#94D2BD]" : "bg-[#005F73]"}`} />
                            {tier.seats}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isFeatured ? "bg-[#EE9B00]" : "bg-[#0A9396]"}`} />
                            {tier.docs}
                          </div>
                        </div>

                        <ul className="space-y-3 pt-1 flex-1">
                          {tier.features.map(f => (
                            <li key={f} className={`flex items-start gap-2.5 text-[13px] leading-snug ${
                              isFeatured ? "text-white/70" : "text-text-secondary"
                            }`}>
                              <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                                isFeatured ? "bg-[#EE9B00]/20 text-[#EE9B00]" : "bg-[#0A9396]/10 text-[#0A9396]"
                              }`}>
                                <Check size={10} strokeWidth={3} />
                              </span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-8 pt-2">
                        {isFeatured ? (
                          <button
                            onClick={() => navigate(`/signup?plan=${encodeURIComponent(tier.name)}`)}
                            className="w-full bg-[#EE9B00] hover:bg-[#CA6702] text-[#001219] text-[15px] font-bold py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-px cursor-pointer shadow-sm"
                          >
                            Get started
                          </button>
                        ) : (
                          <Btn
                            variant="secondary"
                            size="lg"
                            className="w-full justify-center"
                            onClick={() => {
                              if (tier.name === "Enterprise") {
                                window.location.href = `mailto:${ENTERPRISE_CONTACT}?subject=Enterprise%20plan%20enquiry`;
                                return;
                              }
                              navigate(`/signup?plan=${encodeURIComponent(tier.name)}`);
                            }}
                          >
                            {tier.name === "Enterprise" ? "Talk to us" : "Get started"}
                          </Btn>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="relative w-full overflow-hidden bg-surface-secondary">
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><EyebrowLight>FAQ</EyebrowLight></Reveal>
          <Reveal delay={60}>
            <h2 className="font-display text-[2rem] sm:text-[2.5rem] leading-tight tracking-[-0.015em] text-text-primary text-center mb-14">
              Frequently asked questions
            </h2>
          </Reveal>

          <div className="max-w-3xl mx-auto flex flex-col">
            <AccordionItem question="Does Copilot send emails automatically?">
              No. Every AI-drafted reply is reviewed by a Sales Engineer before it goes out — there is no auto-send mode, at any confidence level.
            </AccordionItem>
            <AccordionItem question="Will the AI make things up about our product?">
              Every claim in a draft is checked against your uploaded knowledge base. Anything that isn't backed by a real source is automatically removed before the SE ever sees the draft.
            </AccordionItem>
            <AccordionItem question="Which CRMs do you support?">
              HubSpot and Zoho are both supported today. The actions agent can search leads and contacts and create records in either.
            </AccordionItem>
            <AccordionItem question="How long does onboarding take?">
              Most teams are drafting their first AI-assisted reply within a day — connect Gmail, upload a handful of product documents, and the extension is live.
            </AccordionItem>
            <AccordionItem question="Is our data isolated from other companies using Copilot?">
              Yes. Every account is fully tenant-isolated at the database level — your knowledge base and client data are never visible to other companies.
            </AccordionItem>
          </div>
        </div>
      </section>

      {/* ─── CLOSING CTA (dark bg) ─── */}
      <section className="relative w-full bg-[#001219] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#005F73]/10 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 py-20 md:py-28 text-center flex flex-col items-center">
          <Reveal>
            <h2 className="font-display text-[2rem] sm:text-[2.75rem] leading-tight tracking-tight text-white mb-4">
              Ready to transform your sales workflow?
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-[15px] text-white/50 max-w-xl mb-10">
              Join 200+ teams already using SalesBox to close deals faster.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER (dark) ─── */}
      <footer className="bg-[#001219] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#005F73] flex items-center justify-center">
              <img src={mascotIconSilhouette} alt="" className="w-4.5 h-4.5 brightness-0 invert" aria-hidden="true" />
            </div>
            <span className="font-display text-[15px] text-white/80">SalesBox</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-white/40">
            <Link to="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
            <Link to="/security" className="hover:text-white/70 transition-colors">Security</Link>
            <span>© 2026 SalesBox. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
