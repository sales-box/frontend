import { Inbox, Clock, AlertTriangle, ChevronRight, Tag, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import { PanelHeader } from '../components/PanelHeader'
import { Skeleton } from '../components/Skeleton'

export interface InboxOverviewData {
  totalEmails: number
  syncedAt: string
  urgentCount?: number
  intentBreakdown?: { label: string; count: number; key: string }[]
  /**
   * Threads a reply has already gone out for, split by the label the AI gave
   * its draft. Both this and `notYetReviewedCount` key off the backend's
   * `reviewedAt`, which the classifier stamps only when a reply for the thread
   * turns up in the mailbox's SENT folder. Nothing here tracks whether a thread
   * was ever opened, so the copy below must not claim it does.
   */
  reviewedBreakdown?: { ready: number; needsReview: number; manual: number }
  /** Threads with no reply sent yet. */
  notYetReviewedCount?: number
}

interface InboxOverviewScreenProps {
  data: InboxOverviewData
  onClose: () => void
  onSelectCategory: (category: string) => void
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

export function InboxOverviewScreen({ data, onClose, onSelectCategory }: InboxOverviewScreenProps) {
  const intentRows: { label: string; count: number | null; key: string }[] =
    data.intentBreakdown ?? [
      { label: 'Product inquiry', count: null, key: 'product-inquiry' },
      { label: 'Demo request',    count: null, key: 'demo-request' },
      { label: 'Support',         count: null, key: 'support' },
      { label: 'Follow-up',       count: null, key: 'follow-up' },
      { label: 'Sensitive',       count: null, key: 'sensitive' },
    ]

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <PanelHeader onClose={onClose} />

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 text-[var(--color-text-primary)]">
        
        {/* 1. Hero: Total Emails */}
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-[var(--radius-xl)] bg-[var(--color-success-light)] border border-[var(--color-success)]/20 flex items-center justify-center mb-4">
            <Inbox size={22} strokeWidth={1.5} className="text-[var(--color-success)]" />
          </div>
          <p className="text-eyebrow mb-1">INBOX SYNCED</p>
          <div
            className="text-numeral-display font-display text-[var(--color-text-primary)] mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {data.totalEmails.toLocaleString()}
          </div>
          <div className="text-small text-[var(--color-text-secondary)] flex items-center justify-center gap-1.5">
            <Clock size={11} strokeWidth={1.5} aria-hidden="true" />
            Last synced {formatSyncedAt(data.syncedAt)}
          </div>
        </div>

        {/* 2. Urgent banner */}
        <button
          className="w-full text-left flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-light)] cursor-pointer hover:border-[var(--color-danger)]/50 transition-colors"
          onClick={() => onSelectCategory('urgent')}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--color-danger)]" />
            <div className="flex flex-col">
              <span className="text-body font-semibold text-[var(--color-danger)]">Urgent Action Required</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.urgentCount !== undefined ? (
              <span className="text-body font-bold text-[var(--color-danger)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {data.urgentCount}
              </span>
            ) : (
              <Skeleton width="w-8" height="h-5" />
            )}
            <ChevronRight size={16} className="text-[var(--color-danger)] opacity-70" />
          </div>
        </button>

        {/* 3. By intent */}
        <div className="flex flex-col gap-2">
          <h3 className="text-eyebrow text-[var(--color-text-secondary)]">BY INTENT</h3>
          <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden divide-y divide-[var(--color-border)]">
            {intentRows.map((item) => (
              <button
                key={item.key}
                className="w-full text-left flex items-center justify-between p-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-tertiary)] transition-colors cursor-pointer"
                onClick={() => onSelectCategory(item.key)}
              >
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-[var(--color-text-secondary)]" />
                  <span className="text-body text-[var(--color-text-primary)]">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  {item.count === null ? (
                    <Skeleton width="w-6" height="h-4" />
                  ) : (
                    <span className="text-body" style={{ fontFamily: 'var(--font-mono)' }}>{item.count}</span>
                  )}
                  <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Replied */}
        <div className="flex flex-col gap-2">
          <h3 className="text-eyebrow text-[var(--color-text-secondary)]">REPLIED — AI CONFIDENCE</h3>
          <div className="flex gap-2">
            <button
              className="flex-1 p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-tertiary)] hover:border-[var(--color-success)]/40 transition-colors cursor-pointer text-center"
              onClick={() => onSelectCategory('ready')}
            >
              <CheckCircle2 size={16} className="mx-auto mb-1 text-[var(--color-success)]" />
              <div className="text-caption text-[var(--color-text-secondary)] mb-1">Ready</div>
              {data.reviewedBreakdown ? (
                <div className="text-body font-semibold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {data.reviewedBreakdown.ready}
                </div>
              ) : (
                <div className="flex justify-center">
                  <Skeleton width="w-6" height="h-4" />
                </div>
              )}
            </button>
            <button
              className="flex-1 p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-tertiary)] hover:border-[var(--color-warning)]/40 transition-colors cursor-pointer text-center"
              onClick={() => onSelectCategory('needs-review')}
            >
              <AlertCircle size={16} className="mx-auto mb-1 text-[var(--color-warning)]" />
              <div className="text-caption text-[var(--color-text-secondary)] mb-1">Needs review</div>
              {data.reviewedBreakdown ? (
                <div className="text-body font-semibold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {data.reviewedBreakdown.needsReview}
                </div>
              ) : (
                <div className="flex justify-center">
                  <Skeleton width="w-6" height="h-4" />
                </div>
              )}
            </button>
            <button
              className="flex-1 p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-tertiary)] hover:border-[var(--color-danger)]/40 transition-colors cursor-pointer text-center"
              onClick={() => onSelectCategory('manual')}
            >
              <FileText size={16} className="mx-auto mb-1 text-[var(--color-danger)]" />
              <div className="text-caption text-[var(--color-text-secondary)] mb-1">Manual</div>
              {data.reviewedBreakdown ? (
                <div className="text-body font-semibold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {data.reviewedBreakdown.manual}
                </div>
              ) : (
                <div className="flex justify-center">
                  <Skeleton width="w-6" height="h-4" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* 5. Bottom text */}
        {data.notYetReviewedCount !== undefined && (
          <div className="text-center pb-2">
            <button
              className="text-small text-[var(--color-text-tertiary)] cursor-pointer hover:underline"
              onClick={() => onSelectCategory('not-reviewed')}
            >
              {data.notYetReviewedCount} with no reply sent yet
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
