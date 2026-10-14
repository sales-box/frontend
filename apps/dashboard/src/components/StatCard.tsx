import type { ReactNode } from "react";

/**
 * A single figure in a StatRow. Deliberately not a card: no border of
 * its own, no shadow, no tinted icon chip, no hover transform, no
 * count-up. The row draws one border around the whole group and rules
 * between the cells, so four figures read as one block of data rather
 * than four competing boxes.
 *
 * There is no trend/delta slot. A "+12%" needs a baseline the product
 * does not store, so it would be decoration presented as fact.
 */
export function StatCard({ label, value, sub }: {
  label: string; value: string; sub?: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="text-eyebrow mb-2">{label}</div>
      <div className="font-display text-[1.75rem] leading-none font-semibold text-text-primary tracking-tight tabular-nums">
        {value}
      </div>
      {sub && <div className="text-xs text-text-tertiary mt-1.5">{sub}</div>}
    </div>
  );
}

/**
 * Wraps StatCards in a single bordered block. `cols` is the desktop
 * column count; cells stack on mobile with horizontal rules instead.
 */
export function StatRow({ children, cols = 3, className = "" }: {
  children: ReactNode; cols?: 2 | 3 | 4; className?: string;
}) {
  const grid = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }[cols];
  return (
    <div
      className={`grid ${grid} border border-border rounded-lg bg-surface divide-y divide-border sm:divide-y-0 sm:divide-x ${className}`}
    >
      {children}
    </div>
  );
}
