import { Skeleton } from '../components/Skeleton'
import { PanelHeader } from '../components/PanelHeader'

/**
 * Loading skeleton — mirrors the BriefingSheet layout.
 * Per DESIGN.md E7: "No typographic treatment — skeleton only."
 * No serif, no text content. Pure utility.
 */
export function LoadingScreen() {
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]" aria-busy="true" aria-label="Loading…">
      <PanelHeader />

      {/* Client card skeleton */}
      <div className="px-4 py-4 border-b border-[var(--color-border)] space-y-3">
        <Skeleton height="h-2.5" width="w-16" />
        <Skeleton height="h-6" width="w-3/4" />
        <Skeleton height="h-3.5" width="w-1/2" />
        <Skeleton height="h-5" width="w-20" />
      </div>

      {/* Confidence section skeleton */}
      <div className="px-4 py-4 border-b border-[var(--color-border)]">
        <Skeleton height="h-2.5" width="w-24" className="mb-3" />
        <div className="flex gap-3">
          <div className="flex-1 rounded-[var(--radius-lg)] bg-[var(--color-surface-tertiary)] h-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.25)] to-transparent animate-shimmer" />
          </div>
          <div className="flex-1 rounded-[var(--radius-lg)] bg-[var(--color-surface-tertiary)] h-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.25)] to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Reply textarea skeleton */}
      <div className="px-4 py-4 flex-1 space-y-3">
        <Skeleton height="h-2.5" width="w-28" />
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-tertiary)] h-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.25)] to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Footer actions skeleton */}
      <div className="px-4 py-3 border-t border-[var(--color-border)] flex gap-2">
        <Skeleton height="h-9" width="w-full" />
        <Skeleton height="h-9" width="w-32" />
      </div>
    </div>
  )
}
