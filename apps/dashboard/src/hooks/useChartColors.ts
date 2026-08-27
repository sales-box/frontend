import { useEffect, useState } from "react";

// recharts renders stroke/fill as SVG presentation attributes, where CSS
// var() does NOT resolve — so read the token values from computed styles
// (and re-read when dark mode toggles the <html class>).
const TOKENS = [
  "--color-primary",
  "--color-accent",
  "--color-border",
  "--color-text-tertiary",
  "--color-surface",
  "--color-text-primary",
] as const;

export interface ChartColors {
  primary: string;
  accent: string;
  border: string;
  /** Axis tick colour — --color-text-tertiary. */
  tick: string;
  surface: string;
  text: string;
}

/**
 * Resolved theme tokens for recharts, kept in sync with the light/dark toggle.
 *
 * Shared by the tenant Analytics page and the operator console so a token
 * rename cannot leave one of them drawing charts in stale colours.
 */
export function useChartColors(): ChartColors {
  const read = (): ChartColors => {
    const cs = getComputedStyle(document.documentElement);
    const [primary, accent, border, tick, surface, text] = TOKENS.map(
      (t) => cs.getPropertyValue(t).trim() || "#000",
    );
    return { primary, accent, border, tick, surface, text };
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setColors(read()));
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => mo.disconnect();
  }, []);
  return colors;
}
