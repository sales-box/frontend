import type { ReactNode } from "react";

/**
 * Standard page header — one 28px title (Figma spec), an optional muted
 * subtitle, and an optional actions slot on the right (buttons, filters,
 * counts). This is the single source of the dashboard page-title style; do
 * not hand-roll `<h1 className="text-[28px]…">` in individual routes.
 */
export function PageHeader({ title, subtitle, actions }: {
  title: string; subtitle?: string; actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em] text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-tertiary mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0 sm:self-start">{actions}</div>}
    </div>
  );
}
