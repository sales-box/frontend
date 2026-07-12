import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

interface CollapsedTabProps {
  /** Called on click — App wires expand OR collapse depending on context */
  onExpand: () => void
  /**
   * When true the chevron flips left and the label reads "Close" —
   * used when the tab sits beside the open panel as a collapse toggle.
   */
  collapseMode?: boolean
}

/**
 * 40px wide vertical strip — the panel's resting state inside Gmail.
 * Also re-used as a collapse toggle when `collapseMode` is true, so the
 * user always has a consistent affordance to open/close the panel.
 *
 * No serif — pure utility chrome per DESIGN.md §4.
 */
export function CollapsedTab({ onExpand, collapseMode = false }: CollapsedTabProps) {
  const Chevron = collapseMode ? ChevronRight : ChevronLeft

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={collapseMode ? 'Close Inbox Copilot' : 'Open Inbox Copilot'}
      onClick={onExpand}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onExpand()}
      className="
        w-10 h-full min-h-[120px]
        flex flex-col items-center justify-center gap-3
        bg-[var(--color-surface)] border-l border-[var(--color-border)]
        cursor-pointer select-none
        hover:bg-[var(--color-surface-tertiary)]
        transition-colors duration-150
        rounded-l-[var(--radius-lg)]
      "
    >
      {/* Logo mark */}
      <div className="w-6 h-6 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
        <Inbox size={12} strokeWidth={1.5} className="text-[var(--color-text-on-primary)]" />
      </div>

      {/* Rotated label */}
      <span
        className="text-[10px] font-semibold tracking-widest uppercase text-[var(--color-text-tertiary)] whitespace-nowrap"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: 'var(--font-body)' }}
      >
        {collapseMode ? 'Close' : 'Copilot'}
      </span>

      {/* Direction chevron */}
      <Chevron size={13} strokeWidth={1.5} className="text-[var(--color-text-tertiary)]" />
    </div>
  )
}
