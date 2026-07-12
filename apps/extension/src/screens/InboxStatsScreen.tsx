import { Inbox, Sparkles, Clock, ArrowRight } from 'lucide-react'
import { PanelHeader } from '../components/PanelHeader'

export interface InboxStatsData {
  totalEmails: number
  processedByAI: number
  syncedAt: string
}

interface InboxStatsScreenProps {
  data: InboxStatsData
  onClose: () => void
  onContinue: () => void
}

function formatSyncedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/**
 * Shown once, right after SE sign-in succeeds — before the per-email
 * Briefing flow. Proves the pipeline can reach the real inbox and stage
 * emails for the AI layer, without needing a specific email open yet.
 *
 * DESIGN.md rule: one numeral-display hero per screen (totalEmails here);
 * everything else stays in mono/body.
 *
 * processedByAI is intentionally NOT shown as a numeral-display — /ai/process
 * is still a 501 stub on the backend, so this stays a muted/secondary line
 * (or hidden entirely if 0) rather than implying a second real number.
 */
export function InboxStatsScreen({ data, onClose, onContinue }: InboxStatsScreenProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <PanelHeader onClose={onClose} />

      <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 text-center">
        <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-success-light)] border border-[var(--color-success)]/20 flex items-center justify-center mb-6">
          <Inbox size={24} strokeWidth={1.25} className="text-[var(--color-success)]" />
        </div>

        <p className="text-eyebrow mb-2">INBOX SYNCED</p>

        <span
          className="text-numeral-display font-display text-[var(--color-text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {data.totalEmails.toLocaleString()}
        </span>
        <p className="text-small text-[var(--color-text-secondary)] leading-relaxed mb-6 max-w-[220px]">
          emails found in this account, ready for the AI pipeline.
        </p>

        <div className="w-full flex flex-col gap-2 mb-8 px-3 py-3 rounded-[var(--radius-md)] bg-[var(--color-surface-tertiary)] border border-[var(--color-border)]">
          {data.processedByAI > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-small text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <Sparkles size={11} strokeWidth={1.5} aria-hidden="true" />
                Processed by AI
              </span>
              <span className="text-mono text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {data.processedByAI.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-small text-[var(--color-text-secondary)] flex items-center gap-1.5">
              <Clock size={11} strokeWidth={1.5} aria-hidden="true" />
              Last synced
            </span>
            <span className="text-mono text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatSyncedAt(data.syncedAt)}
            </span>
          </div>
        </div>

        <button
          id="ext-stats-continue-btn"
          onClick={onContinue}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-[var(--color-text-on-primary)] text-caption hover:opacity-90 transition-opacity cursor-pointer"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Continue <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
