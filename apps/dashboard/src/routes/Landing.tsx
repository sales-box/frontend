import { useState, useEffect } from "react";
import { ArrowRight, Check, BookOpen, TrendingUp, Activity, Menu, X, Mail, Link2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import type { Screen } from "../types";
import { Btn } from "../components/Btn";
import { Reveal } from "../components/Reveal";
import { CountUp } from "../components/CountUp";
import { Marquee } from "../components/Marquee";
import { AccordionItem } from "../components/Accordion";
import { ThemeToggle } from "../components/ThemeToggle";
import heroMascot from "../assets/hero-mascot-composition.png";
import mascotIconSilhouette from "../assets/mascot-icon-silhouette.svg";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";
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
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tiers = [
    { name: "Starter", price: "$49", period: "/mo", seats: "Up to 3 Sales Engineers", docs: "25 documents",
      features: ["AI reply suggestions", "Knowledge Base upload", "Basic analytics"], highlight: false },
    { name: "Growth", price: "$149", period: "/mo", seats: "Up to 10 Sales Engineers", docs: "200 documents",
      features: ["Everything in Starter", "CRM integration", "Advanced analytics", "Priority support"], highlight: true },
    { name: "Enterprise", price: "Custom", period: "", seats: "Unlimited seats", docs: "Unlimited documents",
      features: ["Everything in Growth", "SSO / SAML", "Dedicated CSM", "SLA guarantee"], highlight: false },
  ];

  const stats = [
    { v: "200+", l: "B2B companies onboard" },
    { v: "67%", l: "replies sent as-is" },
    { v: "4.8", l: "average G2 rating" },
  ];

  return (
    <div className="min-h-[100dvh] bg-surface font-body text-text-primary">
      <header className="fixed top-4 left-4 right-4 z-50 max-w-6xl mx-auto">
        <div className={`w-full bg-surface/75 dark:bg-surface-secondary/70 backdrop-blur-md border border-border shadow-md rounded-full h-14 px-4 sm:px-6 flex items-center justify-between gap-3 transition-all duration-300 hover:border-primary/20 ${
          scrolled ? "bg-surface/90 dark:bg-surface-secondary/85 shadow-lg border-primary/10" : ""
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12 hover:scale-105 active:scale-95 shadow-sm">
              <img src={mascotIconSilhouette} alt="" className="w-4.5 h-4.5 brightness-0 invert" aria-hidden="true" />
            </div>
            <span className="font-display text-[14px] font-semibold text-text-primary tracking-tight truncate">Inbox Sales Copilot</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-text-secondary">
            {[
              { id: "features", label: "Features" },
              { id: "how-it-works", label: "How it works" },
              { id: "integrations", label: "Integrations" },
              { id: "testimonials", label: "Testimonials" },
              { id: "pricing", label: "Pricing" },
              { id: "faq", label: "FAQ" }
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="relative py-1.5 group/nav hover:text-text-primary transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {item.label}
                <span className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary to-secondary rounded-full scale-x-0 group-hover/nav:scale-x-100 transition-transform duration-300 origin-center" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4 flex-shrink-0">
            <ThemeToggle variant="standard" className="hidden md:flex" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full text-text-secondary hover:text-text-primary hover:bg-border/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X size={20} strokeWidth={1.5} />
              ) : (
                <Menu size={20} strokeWidth={1.5} />
              )}
            </button>
            <Btn variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full text-xs font-semibold px-4 h-9" onClick={() => onNav("signin")}>Sign in</Btn>
            <Btn variant="gradient" size="sm" className="rounded-full text-xs font-semibold px-5 h-9" onClick={() => onNav("signup")}>Register</Btn>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface/95 dark:bg-surface-secondary/95 backdrop-blur-md border border-border rounded-2xl shadow-md p-4 flex flex-col gap-1.5 z-50 md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {[
              { id: "features", label: "Features" },
              { id: "how-it-works", label: "How it works" },
              { id: "integrations", label: "Integrations" },
              { id: "testimonials", label: "Testimonials" },
              { id: "pricing", label: "Pricing" },
              { id: "faq", label: "FAQ" }
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-4 py-2 hover:bg-border/30 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                  setMobileMenuOpen(false);
                }}
              >
                {item.label}
              </a>
            ))}
            <hr className="border-border my-1" />
            <div className="flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-text-secondary">
              <span>Theme Preference</span>
              <ThemeToggle variant="standard" />
            </div>
            <hr className="border-border my-1" />
            <a
              href="#signin"
              className="px-4 py-2 hover:bg-border/30 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                onNav("signin");
              }}
            >
              Sign in
            </a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative w-full overflow-hidden">
        <div aria-hidden className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-accent-warm/15 via-primary/10 to-transparent blur-[120px] pointer-events-none" />
        <div aria-hidden className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-secondary/15 via-accent-cool/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-24 md:pt-36 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-end">
            <div className="lg:col-span-7">
              <Reveal><Eyebrow>AI email intelligence for B2B sales</Eyebrow></Reveal>
              <Reveal delay={90}>
                <h1 className="font-display text-[2.75rem] sm:text-[4rem] lg:text-[5.25rem] leading-[0.95] tracking-[-0.02em] text-text-primary">
                  Reply <em className="text-primary not-italic">smarter.</em><br />Close faster.
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
                  <Btn variant="gradient" size="lg" className="w-full sm:w-auto group" onClick={() => onNav("signup")}>
                    Register your company
                    <ArrowRight size={15} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
                  </Btn>
                </div>
              </Reveal>
              <Reveal delay={360}>
                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-text-tertiary">
                  {["Trusted by 200+ B2B companies", "4.8 / 5 on G2"].map((t, i) => (
                    <div key={t} className="flex items-center gap-6">
                      {i > 0 && <span className="h-3 w-px bg-border hidden sm:block" />}
                      <span className="flex items-center gap-1.5"><Check size={13} strokeWidth={2} className="text-accent-cool" /> {t}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={220} className="lg:col-span-5 flex justify-center lg:justify-end">
              <img
                src={heroMascot}
                alt="Inbox Sales Copilot Mascot"
                className="w-full max-w-[440px] h-auto object-contain transition-transform duration-300 hover:-translate-y-1 select-none"
                aria-hidden="true"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* LOGO CLOUD (Marquee) */}
      <section id="proof" className="w-full py-10 border-t border-border bg-surface-secondary/30 dark:bg-surface-secondary/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-eyebrow text-text-tertiary mb-6 text-center">Trusted by 200+ B2B sales teams</p>
          <Marquee>
            <span className="text-xl font-display font-semibold text-text-tertiary/60 whitespace-nowrap">Northwind Robotics</span>
            <span className="text-xl font-display font-semibold text-text-tertiary/60 whitespace-nowrap">Brightwave Technologies</span>
            <span className="text-xl font-display font-semibold text-text-tertiary/60 whitespace-nowrap">Cyberdyne Systems</span>
            <span className="text-xl font-display font-semibold text-text-tertiary/60 whitespace-nowrap">Globex Industrial</span>
            <span className="text-xl font-display font-semibold text-text-tertiary/60 whitespace-nowrap">Initech Cloud</span>
            <span className="text-xl font-display font-semibold text-text-tertiary/60 whitespace-nowrap">Acme Manufacturing</span>
          </Marquee>
        </div>
      </section>

      {/* INK BAND */}
      <section className="relative bg-surface dark:bg-surface-secondary text-text-primary overflow-hidden border-t border-border">
        <div aria-hidden className="absolute -top-1/2 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/25 dark:bg-primary/35 blur-[120px] pointer-events-none" />
        <div aria-hidden className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("${GRAIN}")` }} />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><div className="text-eyebrow text-text-tertiary mb-7">Why teams switch</div></Reveal>
          <Reveal delay={100}>
            <p className="font-display text-[1.75rem] sm:text-[2.5rem] lg:text-[2.9rem] leading-[1.15] tracking-[-0.01em] max-w-[46rem] text-text-primary">
              Every reply, grounded in your <em className="not-italic underline decoration-2 underline-offset-4 decoration-[color:var(--color-secondary)]">own product truth</em> — no hallucinations, no guesswork, no cold-start.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-6 mt-14 pt-10 border-t border-border">
            {stats.map((s, i) => {
              const colors = ["text-primary", "text-accent-cool", "text-accent-warm", "text-secondary"];
              return (
                <Reveal key={s.l} delay={i * 110}>
                  <div className={`font-display text-[2.25rem] sm:text-[2.75rem] leading-none ${colors[i]}`}>
                    <CountUp value={s.v} />
                  </div>
                  <div className="text-[13px] text-text-secondary mt-2 leading-snug">{s.l}</div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative w-full overflow-hidden border-t border-border">
        <div aria-hidden className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/10 via-accent-cool/5 to-transparent blur-[100px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><Eyebrow>How it works</Eyebrow></Reveal>
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            {[
              {
                num: "01",
                title: "Connect Gmail",
                desc: "Sign in with Google. The extension installs directly into your inbox, no separate app to check."
              },
              {
                num: "02",
                title: "Upload your knowledge",
                desc: "Product docs, pricing sheets, past proposals — the AI grounds every reply in what you upload, nothing invented."
              },
              {
                num: "03",
                title: "AI drafts the reply",
                desc: "Open a client email in Gmail and a context-aware draft appears in the sidebar, with a confidence score."
              },
              {
                num: "04",
                title: "You review and send",
                desc: "Every reply is reviewed by a Sales Engineer before it goes out. Nothing sends automatically — ever."
              }
            ].map((step, i) => (
              <Reveal
                key={step.num}
                delay={i * 120}
                variant={i % 2 === 0 ? "left" : "right"}
                className="relative flex flex-col items-start"
              >
                {i < 3 && (
                  <div className="hidden md:block absolute top-5 left-[calc(100%-1rem)] w-[calc(100%-2rem)] h-px bg-border z-0" />
                )}
                <div className="font-display text-[2.5rem] font-bold text-primary/30 dark:text-primary/40 leading-none mb-3 z-10">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2 z-10">{step.title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed z-10">{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative w-full overflow-hidden border-t border-border">
        <div aria-hidden className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-primary/10 via-accent-cool/5 to-transparent blur-[100px] pointer-events-none" />
        <div aria-hidden className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-secondary/10 via-accent-warm/5 to-transparent blur-[100px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><Eyebrow>What it does</Eyebrow></Reveal>
          
          <div className="grid md:grid-cols-3 gap-6 auto-rows-fr">
            {/* 1. Knowledge-grounded replies (Col-span-2) */}
            <Reveal className="md:col-span-2 h-full">
              <div className="group relative h-full bg-surface-secondary/40 dark:bg-surface-secondary/20 border border-border hover:border-primary/40 rounded-2xl p-7 md:p-8 flex flex-col lg:flex-row justify-between gap-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/5 cursor-pointer">
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-md bg-accent-cool-light dark:bg-accent-cool/15 flex items-center justify-center text-accent-cool mb-6">
                      <BookOpen size={17} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-subheading text-text-primary text-xl font-bold mb-2">Knowledge-grounded replies</h3>
                    <p className="text-body text-text-secondary max-w-[28rem]">
                      Upload product docs once. Every AI reply cites your actual materials — never a hallucination, so your reps always write with absolute confidence.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-accent-cool group-hover:text-primary transition-colors">
                    Learn about groundings <ArrowRight size={13} />
                  </div>
                </div>
                
                {/* Visual Chat Mockup */}
                <div className="w-full lg:w-[240px] flex-shrink-0 bg-surface dark:bg-surface-tertiary border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm select-none">
                  <div className="flex items-center justify-between border-b border-border pb-2 text-[10px] text-text-tertiary font-bold tracking-[0.05em] uppercase">
                    <span>Drafting Copilot</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="bg-border/30 dark:bg-surface-secondary/50 rounded-lg p-2.5 text-[11px] text-text-secondary">
                      <div className="font-semibold text-text-tertiary mb-1">Prospect Question:</div>
                      "Do you support SAML SSO?"
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 text-[11px] text-text-primary relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                      <div className="font-semibold text-primary mb-1">Copilot Suggestion:</div>
                      "Yes, we support SAML SSO through Okta and Microsoft Entra ID."
                      <div className="mt-2 pt-1.5 border-t border-primary/10 flex items-center gap-1 text-[9px] text-accent-cool font-semibold">
                        <Check size={9} strokeWidth={3} /> Citations: <Link to="/security" className="hover:underline">Security Policy</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* 2. Dual confidence scores (Col-span-1) */}
            <Reveal className="md:col-span-1 h-full">
              <div className="group relative h-full bg-surface-secondary/40 dark:bg-surface-secondary/20 border border-border hover:border-secondary/40 rounded-2xl p-7 md:p-8 flex flex-col justify-between gap-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-secondary/5 cursor-pointer">
                <div>
                  <div className="w-9 h-9 rounded-md bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center text-secondary mb-6">
                    <TrendingUp size={17} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-subheading text-text-primary text-xl font-bold mb-2">Dual confidence scores</h3>
                  <p className="text-body text-text-secondary">
                    Product knowledge and client history, scored separately — so reps know exactly when to review.
                  </p>
                </div>
                
                {/* Visual Confidence Score Meters */}
                <div className="bg-surface dark:bg-surface-tertiary border border-border rounded-xl p-4 flex flex-col gap-4 shadow-sm select-none">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-text-secondary mb-1.5">
                      <span>Product Match</span>
                      <span className="text-primary font-semibold">96%</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-primary to-accent-cool rounded-full transition-all duration-1000 ease-out w-[96%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-text-secondary mb-1.5">
                      <span>History Match</span>
                      <span className="text-secondary font-semibold">89%</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-secondary to-accent-warm rounded-full transition-all duration-1000 ease-out w-[89%]" />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* 3. Knowledge-gap analytics (Col-span-1) */}
            <Reveal className="md:col-span-1 h-full">
              <div className="group relative h-full bg-surface-secondary/40 dark:bg-surface-secondary/20 border border-border hover:border-warning/40 rounded-2xl p-7 md:p-8 flex flex-col justify-between gap-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-warning/5 cursor-pointer">
                <div>
                  <div className="w-9 h-9 rounded-md bg-warning/10 dark:bg-warning/15 flex items-center justify-center text-warning mb-6">
                    <Activity size={17} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-subheading text-text-primary text-xl font-bold mb-2">Knowledge-gap analytics</h3>
                  <p className="text-body text-text-secondary">
                    See the questions your reps can't answer yet, and which documents need updating.
                  </p>
                </div>
                
                {/* Visual Gap Indicators */}
                <div className="bg-surface dark:bg-surface-tertiary border border-border rounded-xl p-3 flex flex-col gap-2 shadow-sm select-none">
                  {[
                    { q: "pricing structure v3", gap: "94% gap" },
                    { q: "GDPR data deletion", gap: "81% gap" },
                    { q: "offline support", gap: "62% gap" }
                  ].map((gap) => (
                    <div key={gap.q} className="flex items-center justify-between text-[11px] bg-border/20 dark:bg-surface-secondary/30 rounded px-2.5 py-1.5 border border-border/50">
                      <span className="font-semibold text-text-secondary truncate max-w-[100px]">{gap.q}</span>
                      <span className="flex items-center gap-1.5 text-warning font-semibold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning animate-ping" />
                        {gap.gap}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* 4. Chrome Extension Sidebar Integration (Col-span-2) */}
            <Reveal className="md:col-span-2 h-full">
              <div className="group relative h-full bg-surface-secondary/40 dark:bg-surface-secondary/20 border border-border hover:border-accent-warm/40 rounded-2xl p-7 md:p-8 flex flex-col lg:flex-row justify-between gap-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-accent-warm/5 cursor-pointer">
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-md bg-accent-warm/10 dark:bg-accent-warm/15 flex items-center justify-center text-accent-warm mb-6">
                      <ArrowRight size={17} strokeWidth={1.5} className="rotate-[-45deg]" />
                    </div>
                    <h3 className="text-subheading text-text-primary text-xl font-bold mb-2">Direct Gmail Integration</h3>
                    <p className="text-body text-text-secondary max-w-[28rem]">
                      Runs as a native sidebar directly inside Gmail. Draft, customize, and save replies to your CRM with zero context switching.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-accent-warm group-hover:text-primary transition-colors">
                    See extension walkthrough <ArrowRight size={13} />
                  </div>
                </div>
                
                {/* Visual Chrome Extension Panel Mockup */}
                <div className="w-full lg:w-[240px] flex-shrink-0 bg-surface dark:bg-surface-tertiary border border-border rounded-xl p-3 flex flex-col gap-2.5 shadow-sm select-none">
                  {/* Extension Top Bar */}
                  <div className="flex items-center gap-1.5 border-b border-border pb-2">
                    <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                      <img src={mascotIconSilhouette} alt="" className="w-3 h-3 brightness-0 invert" />
                    </div>
                    <span className="text-[10px] font-bold text-text-primary">Inbox Copilot</span>
                  </div>
                  {/* Extension Content */}
                  <div className="flex flex-col gap-2">
                    <div className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">Recommended Action</div>
                    <div className="border border-border/80 rounded-lg p-2 bg-border/20 dark:bg-surface-secondary/40 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-text-primary">
                        <span>Insert drafted reply</span>
                        <span className="text-accent-cool">94% score</span>
                      </div>
                      <p className="text-[9px] text-text-secondary leading-snug">
                        "Sure! I've attached our security overview document for your team..."
                      </p>
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      <div className="flex-1 text-[9px] text-center font-bold bg-primary text-white py-1 rounded cursor-pointer hover:bg-primary-hover transition-colors">Insert</div>
                      <div className="flex-1 text-[9px] text-center font-bold border border-border text-text-secondary py-1 rounded cursor-pointer hover:bg-border/30 transition-colors">Edit</div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integrations" className="relative w-full overflow-hidden border-t border-border">
        <div aria-hidden className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-secondary/10 via-accent-cool/5 to-transparent blur-[100px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><Eyebrow>Integrations</Eyebrow></Reveal>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Gmail",
                desc: "Native inbox sidebar",
                status: "Connected",
                icon: Mail,
                color: "bg-primary/10 text-primary dark:bg-primary/20"
              },
              {
                name: "HubSpot",
                desc: "Two-way CRM sync",
                status: "Available",
                icon: Link2,
                color: "bg-secondary/10 text-secondary dark:bg-secondary/20"
              },
              {
                name: "Zoho",
                desc: "Two-way CRM sync",
                status: "Planned",
                icon: Link2,
                color: "bg-accent-warm/10 text-accent-warm dark:bg-accent-warm/20"
              }
            ].map((int, i) => (
              <Reveal
                key={int.name}
                delay={i * 120}
                variant="scale"
                className="h-full"
              >
                <div className="group relative h-full bg-surface-secondary/40 dark:bg-surface-secondary/20 border border-border hover:border-primary/40 rounded-2xl p-7 flex flex-col justify-between gap-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/5">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg ${int.color} flex items-center justify-center`}>
                      <int.icon size={20} strokeWidth={1.5} />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                      int.status === "Connected" 
                        ? "bg-success-light text-success dark:bg-success/15" 
                        : "bg-surface-tertiary text-text-tertiary dark:bg-surface-secondary"
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

      {/* PLACEHOLDER TESTIMONIALS — replace with real customer quotes before this section ships to production. Content/marketing owns this copy. */}
      {/* TESTIMONIALS */}
      <section id="testimonials" className="relative w-full overflow-hidden border-t border-border">
        <div aria-hidden className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-accent-warm/10 via-primary/5 to-transparent blur-[100px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><Eyebrow>Testimonials</Eyebrow></Reveal>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Before Inbox Sales Copilot, our sales engineering team spent hours drafting security and technical replies. Now, they're drafted instantly with accurate citations.",
                author: "S. Chen",
                role: "Sales Engineering Lead",
                company: "Tech Corp (Placeholder)"
              },
              {
                quote: "The dual confidence scores are a game changer. We can instantly tell if a reply is grounded in our latest docs or needs manual eyes. Highly recommend it.",
                author: "M. Patel",
                role: "Director of Technical Sales",
                company: "Software Systems (Placeholder)"
              },
              {
                quote: "Onboarding was incredibly simple. We connected Gmail, uploaded our product manuals, and our team was drafting responses in under an hour. Best tool we've added this year.",
                author: "A. Reyes",
                role: "Lead Sales Engineer",
                company: "Global Logistics (Placeholder)"
              }
            ].map((test, i) => (
              <Reveal
                key={test.author}
                delay={i * 120}
                variant="scale"
                className="h-full"
              >
                <div className="group relative h-full bg-surface-secondary/40 dark:bg-surface-secondary/20 border border-border hover:border-secondary/40 rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-secondary/5">
                  <p className="text-[14px] italic text-text-secondary leading-relaxed mb-6">
                    "{test.quote}"
                  </p>
                  <div>
                    <div className="font-semibold text-text-primary text-[14px]">{test.author}</div>
                    <div className="text-[12px] text-text-tertiary">{test.role}, {test.company}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative w-full overflow-hidden border-t border-border">
        <div aria-hidden className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-accent-warm/10 via-primary/5 to-transparent blur-[100px] pointer-events-none" />
        <div aria-hidden className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-secondary/10 via-accent-cool/5 to-transparent blur-[100px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><Eyebrow>Pricing</Eyebrow></Reveal>
          <Reveal delay={60}>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-12">
              <h2 className="font-display text-[2rem] sm:text-[2.5rem] leading-tight tracking-[-0.015em] text-text-primary">
                Simple, <em className="text-primary not-italic">transparent</em> pricing
              </h2>
              <p className="text-body text-text-secondary sm:pb-2">14-day free trial · no credit card required</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {tiers.map((tier, i) => {
              const isFeatured = tier.highlight;
              return (
                <Reveal key={tier.name} delay={i * 120} className="h-full">
                  <div
                    className={`group relative h-full rounded-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col ${
                      isFeatured
                        ? "p-[1.5px] bg-gradient-to-br from-primary via-secondary to-accent-cool shadow-glow-primary scale-100 md:scale-105 z-10"
                        : "p-[1px] bg-border hover:bg-gradient-to-br hover:from-primary/30 hover:to-secondary/30 shadow-1"
                    }`}
                  >
                    <div
                      className={`h-full rounded-[15px] p-8 flex flex-col justify-between relative overflow-hidden ${
                        isFeatured
                          ? "bg-surface dark:bg-surface-tertiary"
                          : "bg-surface dark:bg-surface-secondary"
                      }`}
                    >
                      {isFeatured && (
                        <>
                          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-primary/10 dark:bg-primary/20 blur-2xl pointer-events-none" />
                          <span className="absolute top-4 right-4 text-[10px] font-bold tracking-[0.08em] uppercase bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-full shadow-sm">
                            Most popular
                          </span>
                        </>
                      )}

                      <div className="flex-1 flex flex-col gap-6">
                        <div>
                          <h3 className="font-display text-xs font-bold tracking-[0.08em] uppercase text-text-tertiary mb-2">
                            {tier.name}
                          </h3>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-[3.25rem] font-bold leading-none text-text-primary tracking-tight">
                              {tier.price}
                            </span>
                            {tier.period && (
                              <span className="text-sm font-medium text-text-tertiary">
                                {tier.period}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-xs font-semibold leading-relaxed text-text-secondary border-y border-border py-4 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {tier.seats}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            {tier.docs}
                          </div>
                        </div>

                        <ul className="space-y-3 pt-1 flex-1">
                          {tier.features.map(f => (
                            <li key={f} className="flex items-start gap-2.5 text-[13px] leading-snug text-text-secondary">
                              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-success/10 dark:bg-success/20 flex items-center justify-center text-success mt-0.5">
                                <Check size={10} strokeWidth={3} />
                              </span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-8 pt-2">
                        <Btn
                          variant={isFeatured ? "gradient" : "secondary"}
                          size="lg"
                          className="w-full justify-center focus-visible:ring-2"
                          onClick={() => navigate(`/signup?plan=${encodeURIComponent(tier.name)}`)}
                        >
                          {tier.name === "Enterprise" ? "Contact sales" : "Get started"}
                        </Btn>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative w-full overflow-hidden border-t border-border">
        <div aria-hidden className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-secondary/10 via-accent-cool/5 to-transparent blur-[100px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
          <Reveal><Eyebrow>FAQ</Eyebrow></Reveal>
          
          <div className="max-w-3xl mx-auto flex flex-col">
            <AccordionItem question="Does Copilot send emails automatically?">
              No. Every AI-drafted reply is reviewed by a Sales Engineer before it goes out — there is no auto-send mode, at any confidence level.
            </AccordionItem>
            <AccordionItem question="Will the AI make things up about our product?">
              Every claim in a draft is checked against your uploaded knowledge base. Anything that isn't backed by a real source is automatically removed before the SE ever sees the draft.
            </AccordionItem>
            <AccordionItem question="Which CRMs do you support?">
              HubSpot is supported today, with Zoho integration planned next.
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

      {/* CLOSING CTA */}
      <section className="relative w-full bg-surface-secondary dark:bg-surface-tertiary border-t border-border overflow-hidden">
        <div aria-hidden className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/10 dark:bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 py-20 md:py-28 text-center flex flex-col items-center">
          <Reveal>
            <h2 className="font-display text-[2.5rem] sm:text-[3.5rem] leading-none tracking-tight text-text-primary mb-6">
              Ready to close faster?
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-base text-text-secondary max-w-xl mb-8">
              Start drafting grounded responses inside Gmail in less than an hour. Set up your team today.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <Btn variant="gradient" size="lg" className="group" onClick={() => onNav("signup")}>
              Register your company
              <ArrowRight size={15} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
            </Btn>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-surface">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center transition-transform duration-300 hover:rotate-6">
              <img src={mascotIconSilhouette} alt="" className="w-4.5 h-4.5 brightness-0 invert" aria-hidden="true" />
            </div>
            <span className="font-display text-[15px] text-text-primary">Inbox Sales Copilot</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-text-tertiary">
            <Link to="/privacy" className={`hover:text-text-primary transition-colors ${focusRing}`}>Privacy</Link>
            <Link to="/terms" className={`hover:text-text-primary transition-colors ${focusRing}`}>Terms</Link>
            <Link to="/security" className={`hover:text-text-primary transition-colors ${focusRing}`}>Security</Link>
            <span>© 2026 Inbox Sales Copilot, Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
