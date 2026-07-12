import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: {
  title: string; subtitle?: string; actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
      <div>
        <h1 className="font-display text-[2rem] sm:text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.02em] text-text-primary">{title}</h1>
        {subtitle && <p className="text-body text-text-secondary mt-1.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0 sm:self-end sm:pb-1">{actions}</div>}
    </div>
  );
}
