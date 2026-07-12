import type { ReactNode } from 'react'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'muted'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
  danger:  'bg-[var(--color-danger-light)]  text-[var(--color-danger)]',
  muted:   'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]',
}

/**
 * Status/context badge pill.
 * Stays in sans-serif (text-small) — never serif. Per DESIGN.md:
 * "Status Badge … stays sans/mono, never serif — it's a scan element, not a hero moment."
 */
export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-small font-medium ${variantClasses[variant]}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {children}
    </span>
  )
}
