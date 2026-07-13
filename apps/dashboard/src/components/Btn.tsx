import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function Btn({ children, variant = "primary", size = "md", disabled, loading, type = "button", onClick, className = "", ...aria }: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "inverse" | "gradient";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-body font-semibold rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface active:translate-y-px tracking-[0.01em]";
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-[13px]",
    md: "px-5 py-2.5 text-[13px]",
    lg: "px-6 py-3 text-[15px]",
  };
  const variants: Record<string, string> = {
    primary: "bg-primary text-text-on-primary hover:bg-primary-hover",
    secondary: "bg-transparent text-text-primary border border-border hover:bg-surface-secondary",
    ghost: "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
    danger: "bg-danger text-white hover:opacity-90",
    inverse: "bg-surface text-primary hover:bg-surface-secondary",
    gradient: "bg-[image:var(--gradient-brand-cool)] text-white hover:shadow-[var(--shadow-glow-primary)]",
  };
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-label={aria["aria-label"]}
      className={`${base} ${sizes[size]} ${variants[variant]} ${isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""} ${className}`}
    >
      {loading && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
      {children}
    </button>
  );
}
