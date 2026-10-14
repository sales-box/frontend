import { useEffect, useState } from "react";

// recharts renders stroke/fill as SVG presentation attributes, where CSS
// var() does NOT resolve — so read the token values from computed styles
// (and re-read when dark mode toggles the <html class>).
const TOKENS = [
  "--color-primary",
  "--color-secondary",
  "--color-border",
  "--color-text-tertiary",
  "--color-surface",
  "--color-text-primary",
] as const;

export interface ChartColors {
  primary: string;
  /** The second brand colour, for a series that must read apart from primary. */
  secondary: string;
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
    // Falls back to `currentColor`, NOT to a literal colour. A token that does
    // not exist used to resolve to "#000", which painted solid black marks that
    // looked deliberate in dark mode and merely ugly in light mode — the chart
    // never looked broken, so nobody noticed the token was missing. Inheriting
    // the text colour stays legible in both themes and still looks wrong enough
    // to investigate.
    const [primary, secondary, border, tick, surface, text] = TOKENS.map(
      (t) => cs.getPropertyValue(t).trim() || "currentColor",
    );
    return { primary, secondary, border, tick, surface, text };
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
