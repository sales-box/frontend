import type { ReactNode } from "react";

export function Card({ children, className = "" }: {
  children: ReactNode; className?: string;
}) {
  return (
    <div className={`bg-surface border border-border shadow-[var(--shadow-1)] rounded-xl ${className}`}>
      {children}
    </div>
  );
}
