interface SkeletonProps {
  /** Tailwind width class, e.g. "w-3/4", "w-full" */
  width?: string
  /** Tailwind height class, e.g. "h-4", "h-10" */
  height?: string
  className?: string
}

/**
 * Shimmer bar for skeleton loading states.
 * Per DESIGN.md E7: "No typographic treatment — skeleton only."
 * Uses surface-tertiary fill + shimmer animation, no serif, no text.
 */
export function Skeleton({ width = 'w-full', height = 'h-4', className = '' }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-tertiary)] ${width} ${height} ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(108,79,232,0.06)] to-transparent animate-shimmer" />
    </div>
  )
}
