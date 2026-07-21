import { PanelHeader } from '../components/PanelHeader'
import type { RepliedSummary } from '../state/panelMachine'

interface RepliedScreenProps {
  summary: RepliedSummary | null
  onClose: () => void
}

const pct = (v: number | null | undefined): string =>
  v == null ? '—' : `${Math.round(v * 100)}%`

export function RepliedScreen({ summary: s, onClose }: RepliedScreenProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] overflow-y-auto">
      <PanelHeader onClose={onClose} />
      <div className="flex flex-col items-center px-6 py-8 text-center">
        <div
          className="w-14 h-14 mb-5 rounded-full flex items-center justify-center text-2xl"
          style={{ background: 'color-mix(in srgb, var(--color-success) 14%, transparent)', color: 'var(--color-success)' }}
          aria-hidden="true"
        >
          ✓
        </div>
        <p className="text-eyebrow mb-2">DONE</p>
        <h1
          className="text-heading text-[var(--color-text-primary)] mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Already <em className="text-primary not-italic">replied.</em>
        </h1>
        <p className="text-small text-[var(--color-text-secondary)] leading-relaxed max-w-[230px] mb-6">
          Your reply is in the thread — nothing left to draft.
        </p>
        {s && (
          <div className="w-full text-left">
            <p className="text-eyebrow mb-3">WHAT THE AI SAW</p>
            <div className="flex gap-3 mb-3">
              <div className="flex-1 rounded-[var(--radius-md)] px-3 py-2 bg-[var(--color-surface-tertiary)]">
                <div className="text-caption text-[var(--color-text-tertiary)]">Product</div>
                <div className="text-body font-semibold text-[var(--color-text-primary)]">{pct(s.productConfidence)}</div>
              </div>
              <div className="flex-1 rounded-[var(--radius-md)] px-3 py-2 bg-[var(--color-surface-tertiary)]">
                <div className="text-caption text-[var(--color-text-tertiary)]">History</div>
                <div className="text-body font-semibold text-[var(--color-text-primary)]">{pct(s.clientHistoryConfidence)}</div>
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] px-3 py-2 bg-[var(--color-surface-tertiary)]">
              <div className="text-caption text-[var(--color-text-tertiary)]">Intent</div>
              <div className="text-body text-[var(--color-text-primary)] capitalize">{s.intent}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
