import type { ReactNode } from "react";
import { Mail, Shield, Zap } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const FEATURES = [
  { icon: <Zap size={18} strokeWidth={1.5} />, text: "AI-powered email replies for your sales team" },
  { icon: <Shield size={18} strokeWidth={1.5} />, text: "Admin oversight with smart escalation flags" },
  { icon: <Mail size={18} strokeWidth={1.5} />, text: "Knowledge-driven answers from your own docs" },
];

export function AuthLayout({ children, onBack }: { children: ReactNode; onBack?: () => void }) {
  return (
    <div className="min-h-[100dvh] font-body flex flex-col lg:flex-row">
      {/* Branding panel — hidden on mobile, left side on desktop */}
      <div
        className="hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden isolate"
        style={{ backgroundColor: "#001219" }}
      >
        {/* Base wash — teal fading into ink, off-axis so it reads as light, not a band */}
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(152deg, #00697E 0%, #00475A 32%, #002430 66%, #001219 100%)" }}
        />

        {/* Aurora glows — soft coloured light rather than flat discs */}
        <div
          className="absolute -z-10 rounded-full"
          style={{
            top: "-18%", left: "-14%", width: "78%", aspectRatio: "1",
            background: "radial-gradient(circle, rgba(10,147,150,0.55) 0%, rgba(10,147,150,0) 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute -z-10 rounded-full"
          style={{
            top: "38%", right: "-30%", width: "72%", aspectRatio: "1",
            background: "radial-gradient(circle, rgba(148,210,189,0.30) 0%, rgba(148,210,189,0) 70%)",
            filter: "blur(56px)",
          }}
        />
        <div
          className="absolute -z-10 rounded-full"
          style={{
            bottom: "-24%", left: "10%", width: "62%", aspectRatio: "1",
            background: "radial-gradient(circle, rgba(233,216,166,0.14) 0%, rgba(233,216,166,0) 70%)",
            filter: "blur(64px)",
          }}
        />

        {/* Blueprint grid, masked so it dissolves outside the headline area */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,210,189,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(148,210,189,0.10) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 85% 65% at 22% 22%, #000 15%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(ellipse 85% 65% at 22% 22%, #000 15%, transparent 72%)",
          }}
        />

        {/* Diagonal sheen */}
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(112deg, transparent 38%, rgba(148,210,189,0.07) 50%, transparent 62%)" }}
        />

        {/* Film grain — kills the banding a large gradient otherwise shows */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.22] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Vignette — pulls the eye back to the copy */}
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "radial-gradient(ellipse 90% 75% at 35% 40%, transparent 35%, rgba(0,18,25,0.6) 100%)" }}
        />

        {/* Top — logo + nav */}
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-3 mb-16 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-lg"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0A9396" }}>
              <span className="text-white font-bold text-lg leading-none">S</span>
            </div>
            <span className="font-semibold text-[17px] text-white tracking-tight">SalesBox</span>
          </button>

          <h2
            className="text-[32px] xl:text-[36px] font-bold leading-[1.15] tracking-tight mb-4"
            style={{ color: "#FFFFFF" }}
          >
            Your AI Sales
            <br />
            Engineering Co-pilot
          </h2>
          <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: "rgba(148, 210, 189, 0.85)" }}>
            Automate sales email responses with your own product knowledge. Built for teams that close deals faster.
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-4 mt-auto">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3.5">
              <div className="shrink-0" style={{ color: "#94D2BD" }}>
                {f.icon}
              </div>
              <span className="text-[14px]" style={{ color: "rgba(255,255,255,0.8)" }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel — full width on mobile, right side on desktop */}
      <div className="flex-1 flex flex-col bg-surface-secondary relative">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0A9396" }}>
              <span className="text-white font-bold text-[14px] leading-none">S</span>
            </div>
            <span className="font-semibold text-[15px] text-text-primary tracking-tight">SalesBox</span>
          </button>
          <ThemeToggle variant="compact" />
        </header>

        {/* Desktop theme toggle */}
        <div className="hidden lg:block absolute top-6 right-6">
          <ThemeToggle variant="compact" />
        </div>

        {/* Form content — centered */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8 lg:py-10">
          <div className="w-full max-w-[26rem]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
