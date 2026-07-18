import type { ReactNode } from "react";

export function Card({ children, className = "" }: {
  children: ReactNode; className?: string;
}) {
  return (
    <div className={`bg-surface border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 rounded-xl ${className}`}>
      {children}
    </div>
  );
}
