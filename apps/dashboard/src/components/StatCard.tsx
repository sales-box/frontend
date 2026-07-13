import { useEffect, useState, type ReactNode } from "react";

function useCountUp(target: number, active: boolean, ms = 1000) {
  const [n, setN] = useState(active ? 0 : target);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setN(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, ms]);
  return n;
}

const TONE: Record<string, string> = {
  blue: "var(--color-primary)",
  green: "var(--color-success)",
  amber: "var(--color-warning)",
  red: "var(--color-danger)",
};

export function StatCard({ label, value, sub, subTone = "muted", size = "md", icon, tone = "blue" }: {
  label: string; value: string; sub?: string;
  subTone?: "muted" | "success"; size?: "md" | "sm";
  icon?: ReactNode; tone?: "blue" | "green" | "amber" | "red";
}) {
  const m = value.match(/^(\D*)(\d[\d,]*)(.*)$/);
  const target = m ? parseInt(m[2].replace(/,/g, ""), 10) : 0;
  const n = useCountUp(target, !!m);
  const shown = m ? `${m[1]}${Math.round(n)}${m[3]}` : value;
  const toneVar = TONE[tone];
  const subCls = subTone === "success" ? "text-success" : "text-text-tertiary";
  const valueCls = size === "md" ? "text-4xl" : "text-3xl";

  return (
    <div className="h-full bg-surface border border-border rounded-xl p-6 transition-transform duration-300 hover:-translate-y-1">
      {icon && (
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
          style={{ background: `color-mix(in srgb, ${toneVar} 14%, transparent)`, color: toneVar }}
        >
          {icon}
        </div>
      )}
      <div className="text-eyebrow mb-1.5">{label}</div>
      <div className={`font-display ${valueCls} font-semibold text-text-primary tracking-tight mb-1 tabular-nums`}>{shown}</div>
      {sub && <div className={`text-xs ${subCls}`}>{sub}</div>}
    </div>
  );
}
