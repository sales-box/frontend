import type { ReactNode } from "react";

/**
 * Plain container. Border + surface only — no drop shadow, no hover
 * transform. A card is not a button; if it is genuinely clickable pass
 * `interactive` and give it a real role/onClick at the call site.
 */
export function Card({ children, interactive = false, className = "" }: {
  children: ReactNode; interactive?: boolean; className?: string;
}) {
  const hover = interactive
    ? "transition-colors duration-150 hover:border-accent-cool cursor-pointer"
    : "";
  return (
    <div className={`bg-surface border border-border rounded-lg ${hover} ${className}`}>
      {children}
    </div>
  );
}
