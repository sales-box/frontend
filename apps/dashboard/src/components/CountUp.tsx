import { useEffect, useRef, useState } from "react";

/** Animates a numeric prefix (e.g. "200" in "200+") up from 0 on scroll into view.
 *  Non-numeric strings (e.g. "SOC 2") pass through unchanged, unanimated. */
export function CountUp({ value, durationMs = 1400 }: { value: string; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);

  useEffect(() => {
    if (!match) return; // no leading number, e.g. "SOC 2" — leave as static text
    const target = parseFloat(match[1]);
    const suffix = match[2];
    const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setDisplay(`${(target * eased).toFixed(decimals)}${suffix}`);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <span ref={ref}>{display}</span>;
}
