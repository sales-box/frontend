import { AlertTriangle, BookOpen, Users, Mail, Edit2, ExternalLink, Building2, Star } from 'lucide-react'
import { PanelHeader } from '../components/PanelHeader'
import { ConfidencePill } from '../components/ConfidencePill'
import { Badge } from '../components/Badge'

export interface LowConfidenceData {
  clientName: string
  company: string
  role: string
  emailTimestamp: string
  productConfidence: number
  clientHistoryConfidence: number
  missingContext: {
    hasProductDocs: boolean
    hasPreviousEmails: boolean
    hasAccountHistory: boolean
  }
}

interface LowConfidenceScreenProps {
  data: LowConfidenceData
  onClose: () => void
  onRefresh: () => void
  onComposeManually: () => void
  onUploadDoc: () => void
}

function formatTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/**
 * Low confidence state — AI doesn't have enough context for a safe suggestion.
 *
 * DESIGN.md serif moment: confidence pills still use ConfidencePill (numeral-display),
 * but they'll both be amber/terracotta given the low pct values.
 * The warning banner heading ("Manual review recommended") stays in text-subheading
 * (Inter 600) — it's a UI alert, NOT an emotional moment.
 *
 * No ink-filled "Send" button — nothing to send. Only a ghost "Compose manually".
 */
export function LowConfidenceScreen({ data, onClose, onRefresh, onComposeManually, onUploadDoc }: LowConfidenceScreenProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <PanelHeader showRefresh onRefresh={onRefresh} onClose={onClose} />

      {/* ── Client card ── */}
      <div className="px-4 pt-4 pb-4 border-b border-[var(--color-border)] bg-[var(--color-surface-tertiary)]">
        <p className="text-eyebrow mb-1.5">BRIEFING SHEET</p>
        <h1
          className="text-heading text-[var(--color-text-primary)] mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {data.clientName}
        </h1>
        <p className="text-caption text-[var(--color-text-secondary)] mb-2.5">
          <Building2 size={11} strokeWidth={1.5} className="inline mr-1 -mt-0.5" aria-hidden="true" />
          {data.company}
          {data.role && <span className="text-[var(--color-text-tertiary)]"> · {data.role}</span>}
        </p>
        <div className="flex items-center justify-between">
          <Badge variant="muted">
            <Star size={9} strokeWidth={1.5} aria-hidden="true" />
            New prospect
          </Badge>
          <span className="text-small text-[var(--color-text-tertiary)] flex items-center gap-1">
            {formatTimestamp(data.emailTimestamp)}
          </span>
        </div>
      </div>

      {/* ── Confidence section (amber/terracotta pills) ── */}
      <div className="px-4 py-4 border-b border-[var(--color-border)]">
        <p className="text-eyebrow mb-3">AI CONFIDENCE</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <ConfidencePill label="PRODUCT" pct={data.productConfidence} />
          </div>
          <div className="flex-1">
            <ConfidencePill label="HISTORY" pct={data.clientHistoryConfidence} />
          </div>
        </div>
      </div>

      {/* ── Warning banner ── */}
      <div className="px-4 py-4 border-b border-[var(--color-border)]">
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20 px-3.5 py-3 flex gap-3">
          <AlertTriangle
            size={16} strokeWidth={1.5}
            className="text-[var(--color-warning)] flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            {/* Subheading — Inter 600, NOT serif. This is a UI alert. */}
            <p
              className="text-subheading text-[var(--color-warning)] mb-0.5"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Manual review recommended
            </p>
            <p className="text-small text-[var(--color-warning)]/80 leading-relaxed">
              Confidence is below the safe threshold. The AI suggestion may be inaccurate.
            </p>
          </div>
        </div>
      </div>

      {/* ── Context availability ── */}
      <div className="px-4 py-4 flex-1 min-h-0 overflow-y-auto">
        <p className="text-eyebrow mb-3">AVAILABLE CONTEXT</p>
        <ul className="space-y-2" aria-label="Context sources available">
          <ContextItem
            icon={<BookOpen size={13} strokeWidth={1.5} aria-hidden="true" />}
            label="Product documentation"
            available={data.missingContext.hasProductDocs}
          />
          <ContextItem
            icon={<Mail size={13} strokeWidth={1.5} aria-hidden="true" />}
            label="Previous email threads"
            available={data.missingContext.hasPreviousEmails}
          />
          <ContextItem
            icon={<Users size={13} strokeWidth={1.5} aria-hidden="true" />}
            label="Account history"
            available={data.missingContext.hasAccountHistory}
          />
        </ul>
      </div>

      {/* ── Footer — ghost button only, no ink "Send" ── */}
      <div className="px-4 py-3 border-t border-[var(--color-border)] flex flex-col gap-2.5 flex-shrink-0">
        <button
          id="ext-compose-manually-btn"
          onClick={onComposeManually}
          className="
            w-full flex items-center justify-center gap-2
            px-4 py-2.5 rounded-[var(--radius-sm)]
            border border-[var(--color-border)]
            bg-transparent text-[var(--color-text-primary)]
            text-caption font-medium
            hover:bg-[var(--color-surface-tertiary)]
            transition-colors duration-150
            cursor-pointer
          "
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <Edit2 size={13} strokeWidth={1.5} aria-hidden="true" />
          Compose reply manually
        </button>

        <button
          id="ext-upload-doc-btn"
          onClick={onUploadDoc}
          className="
            flex items-center justify-center gap-1.5
            text-small text-[var(--color-secondary)]
            hover:text-[var(--color-secondary-hover)]
            transition-colors cursor-pointer
            bg-transparent border-none p-0
          "
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <ExternalLink size={11} strokeWidth={1.5} aria-hidden="true" />
          Upload missing doc to Knowledge Base
        </button>
      </div>
    </div>
  )
}

/* ── Context item row ── */
function ContextItem({ icon, label, available }: {
  icon: React.ReactNode
  label: string
  available: boolean
}) {
  return (
    <li className="flex items-center gap-2.5">
      <span className={available ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
        {icon}
      </span>
      <span className="text-caption text-[var(--color-text-secondary)]">{label}</span>
      <span className={`ml-auto text-small font-medium ${available ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
        {available ? 'Available' : 'Missing'}
      </span>
    </li>
  )
}
