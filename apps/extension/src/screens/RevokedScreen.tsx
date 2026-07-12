import { ShieldX } from 'lucide-react'
import { PanelHeader } from '../components/PanelHeader'

interface RevokedScreenProps {
  onClose?: () => void
}

/**
 * Access revoked — full-panel terminal state.
 * No CTA — the user cannot do anything from here.
 *
 * DESIGN.md serif moment: heading "Access <em>revoked</em>."
 * Logo is muted (greyed) — the product is disabled.
 *
 * Per DESIGN.md §9 E6: "Full treatment — these are full-panel emotional moments."
 */
export function RevokedScreen({ onClose }: RevokedScreenProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* Header with muted logo — product access is gone */}
      <PanelHeader muted onClose={onClose} />

      {/* Body */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 text-center">
        {/* Icon in danger container */}
        <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 flex items-center justify-center mb-6">
          <ShieldX size={24} strokeWidth={1.25} className="text-[var(--color-danger)]" />
        </div>

        {/* Eyebrow + heading */}
        <p className="text-eyebrow mb-2">ACCESS STATUS</p>
        <h1
          className="text-heading text-[var(--color-text-primary)] mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Access{' '}
          <em className="italic">revoked.</em>
        </h1>

        <p className="text-small text-[var(--color-text-secondary)] leading-relaxed max-w-[220px]">
          Your Sales Engineer access has been removed by an administrator. Contact your manager to restore access.
        </p>

        {/* No CTA — per sprint spec: "all other actions disabled" */}
      </div>
    </div>
  )
}
