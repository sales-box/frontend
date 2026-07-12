import type { ReactNode } from "react";

export function Badge({ children, variant = "muted" }: {
  children: ReactNode;
  variant?: "success" | "warning" | "danger" | "muted" | "accent";
}) {
  const styles: Record<string, string> = {
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning",
    danger: "bg-danger-light text-danger",
    accent: "bg-accent-light text-accent",
    muted: "bg-surface-secondary text-text-tertiary",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-body font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
