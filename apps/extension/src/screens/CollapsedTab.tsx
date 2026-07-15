import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LogoMark } from '../components/LogoMark'

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
 * Uses the actual Inbox Copilot brand lightning bolt logo.
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
        hover:bg-[var(--color-surface-secondary)]
        transition-all duration-200
        rounded-l-[var(--radius-lg)]
        group
        relative
      "
      style={{ boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.1)' }}
    >
      {/* Brand logo mark */}
      <div
        className="
          w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0
          bg-[var(--color-primary)] text-white
          transition-all duration-200
          group-hover:scale-105 group-hover:shadow-sm
        "
      >
        <LogoMark size={16} color="currentColor" />
      </div>

      {/* Rotated label */}
      <span
        className="text-[9px] font-bold tracking-widest uppercase text-[var(--color-text-tertiary)] whitespace-nowrap group-hover:text-[var(--color-primary)] transition-colors duration-200"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: 'var(--font-body)' }}
      >
        {collapseMode ? 'Close' : 'Copilot'}
      </span>

      {/* Direction chevron */}
      <Chevron
        size={12}
        strokeWidth={2}
        className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors duration-200"
      />
    </div>
  )
}
