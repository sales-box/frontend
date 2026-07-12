interface ConfidencePillProps {
  /** Short uppercase label shown beneath the numeral (e.g. "PRODUCT" | "HISTORY") */
  label: string
  /** 0–100 integer */
  pct: number
}

/** Colour tiers from DESIGN.md */
function getColor(pct: number) {
  if (pct >= 80) return {
    numeral: 'text-[var(--color-success)]',
    eye:     'text-[var(--color-success)]',
    bg:      'bg-[var(--color-success-light)]',
  }
  if (pct >= 60) return {
    numeral: 'text-[var(--color-warning)]',
    eye:     'text-[var(--color-warning)]',
    bg:      'bg-[var(--color-warning-light)]',
  }
  return {
    numeral: 'text-[var(--color-danger)]',
    eye:     'text-[var(--color-danger)]',
    bg:      'bg-[var(--color-danger-light)]',
  }
}

/**
 * Briefing Sheet hero confidence display.
 *
 * Per DESIGN.md §5 — the confidence score is the ONE numeral-display
 * (large serif) hero element in the extension panel.
 * All other numbers stay in mono or body.
 */
export function ConfidencePill({ label, pct }: ConfidencePillProps) {
  const { numeral, eye, bg } = getColor(pct)

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 px-5 py-3 rounded-[var(--radius-lg)] ${bg}`}
      role="status"
      aria-label={`${label} confidence: ${pct}%`}
    >
      {/* THE hero numeral — Fraunces serif */}
      <span
        className={`text-numeral-display font-display ${numeral}`}
        style={{ fontFamily: 'var(--font-display)' }}
        aria-hidden="true"
      >
        {pct}%
      </span>
      {/* Eyebrow beneath the number */}
      <span className={`text-eyebrow ${eye}`} aria-hidden="true">
        {label}
      </span>
    </div>
  )
}
