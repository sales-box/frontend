import { AlertTriangle, BookOpen, Users, Mail, Edit2, ExternalLink, Building2, Star, Flag, CheckCircle2, ArrowLeft, ArrowRight, Send } from 'lucide-react'
import { useState } from 'react'
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
  suggestedReply?: string
}

interface LowConfidenceScreenProps {
  data: LowConfidenceData
  onClose: () => void
  onRefresh: () => void
  onComposeManually: () => void
  onInsertDraft: (reply: string) => void
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
 * Split into two internal views to avoid cramming everything into one screen:
 *  - 'summary': briefing card + confidence + warning + available context
 *  - 'draft':   the AI's draft text (if any) + the 3 action buttons
 * No ink-filled "Send" button anywhere — nothing here is auto-sent.
 */
export function LowConfidenceScreen({ data, onClose, onRefresh, onComposeManually, onInsertDraft, onUploadDoc }: LowConfidenceScreenProps) {
  const [view, setView] = useState<'summary' | 'draft'>('summary')
  const [reported, setReported] = useState(false)
  const [reporting, setReporting] = useState(false)

  const handleReportGap = async () => {
    if (reported || reporting) return
    setReporting(true)
    try {
      const { jwt } = await chrome.storage.local.get('jwt')
      const topic = data.company || 'Unknown company'
      await chrome.runtime.sendMessage({
        type: 'REPORT_KNOWLEDGE_GAP',
        jwt: jwt ?? '',
        topic,
      })
      setReported(true)
    } catch (err) {
      console.error('[Copilot] reportKnowledgeGap failed:', err)
    } finally {
      setReporting(false)
    }
  }

  if (view === 'draft') {
    return (
      <div className="flex flex-col h-full bg-[var(--color-surface)]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-warning-light)] flex-shrink-0">
          <button
            onClick={() => setView('summary')}
            aria-label="Back to briefing"
            className="p-1.5 -ml-1.5 rounded-[var(--radius-sm)] text-[var(--color-warning)] hover:bg-white/40 transition-colors cursor-pointer flex-shrink-0"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <AlertTriangle size={14} strokeWidth={1.5} className="text-[var(--color-warning)] flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-subheading text-[var(--color-warning)] leading-none" style={{ fontFamily: 'var(--font-body)' }}>
              AI Draft — unverified
            </p>
            <p className="text-small text-[var(--color-warning)]/70 leading-none mt-0.5">
              Review carefully before sending
            </p>
          </div>
        </div>

        <div className="px-4 py-4 flex-1 min-h-0 overflow-y-auto">
          {data.suggestedReply ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-light)]/40 px-3.5 py-3 text-caption text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
              {data.suggestedReply}
            </div>
          ) : (
            <p className="text-caption text-[var(--color-text-tertiary)]">No draft available — compose manually below.</p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-[var(--color-border)] flex flex-col gap-2.5 flex-shrink-0">
          {data.suggestedReply && (
            <button
              id="ext-insert-draft-btn"
              onClick={() => onInsertDraft(data.suggestedReply!)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-warning)] text-[#2A1B00] text-caption font-semibold hover:opacity-90 transition-opacity duration-150 cursor-pointer"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <Send size={13} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-center break-words">Insert draft into Gmail</span>
            </button>
          )}
          <button
            id="ext-compose-manually-btn"
            onClick={onComposeManually}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] text-caption font-medium hover:bg-[var(--color-surface-tertiary)] transition-colors duration-150 cursor-pointer"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <Edit2 size={13} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 text-center break-words">Compose reply manually</span>
          </button>

          <button
            id="ext-upload-doc-btn"
            onClick={onUploadDoc}
            className="flex items-center justify-center gap-1.5 text-small text-[var(--color-secondary)] hover:text-[var(--color-secondary-hover)] transition-colors cursor-pointer bg-transparent border-none p-0"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <ExternalLink size={11} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
            <span className="min-w-0 text-center break-words">Upload missing doc to Knowledge Base</span>
          </button>

          {reported ? (
            <p className="flex items-center justify-center gap-1.5 text-small text-[var(--color-success)]">
              <CheckCircle2 size={12} strokeWidth={1.5} aria-hidden="true" />
              Reported to your admin ✅
            </p>
          ) : (
            <button
              id="ext-report-gap-btn"
              onClick={handleReportGap}
              disabled={reporting}
              className="flex items-center justify-center gap-1.5 text-small text-[var(--color-warning)] hover:text-[var(--color-warning)]/80 transition-colors cursor-pointer bg-transparent border-none p-0 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <Flag size={11} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
              <span className="min-w-0 text-center break-words">{reporting ? 'Reporting…' : 'Report knowledge gap'}</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <PanelHeader showRefresh onRefresh={onRefresh} onClose={onClose} />

      <div className="px-4 pt-4 pb-4 border-b border-[var(--color-border)] bg-[var(--color-surface-tertiary)]">
        <p className="text-eyebrow mb-1.5">BRIEFING SHEET</p>
        <h1 className="text-heading text-[var(--color-text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
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

      <div className="px-4 py-4 border-b border-[var(--color-border)]">
        <p className="text-eyebrow mb-3">AI CONFIDENCE</p>
        <div className="flex gap-3">
          <div className="flex-1"><ConfidencePill label="PRODUCT" pct={data.productConfidence} /></div>
          <div className="flex-1"><ConfidencePill label="HISTORY" pct={data.clientHistoryConfidence} /></div>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-[var(--color-border)]">
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20 px-3.5 py-3 flex gap-3">
          <AlertTriangle size={16} strokeWidth={1.5} className="text-[var(--color-warning)] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-subheading text-[var(--color-warning)] mb-0.5" style={{ fontFamily: 'var(--font-body)' }}>
              Manual review recommended
            </p>
            <p className="text-small text-[var(--color-warning)]/80 leading-relaxed">
              Confidence is below the safe threshold. The AI suggestion may be inaccurate.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex-1 min-h-0 overflow-y-auto">
        <p className="text-eyebrow mb-3">AVAILABLE CONTEXT</p>
        <ul className="space-y-2" aria-label="Context sources available">
          <ContextItem icon={<BookOpen size={13} strokeWidth={1.5} aria-hidden="true" />} label="Product documentation" available={data.missingContext.hasProductDocs} />
          <ContextItem icon={<Mail size={13} strokeWidth={1.5} aria-hidden="true" />} label="Previous email threads" available={data.missingContext.hasPreviousEmails} />
          <ContextItem icon={<Users size={13} strokeWidth={1.5} aria-hidden="true" />} label="Account history" available={data.missingContext.hasAccountHistory} />
        </ul>
      </div>

      <div className="px-4 py-3 border-t border-[var(--color-border)] flex-shrink-0">
        {data.suggestedReply ? (
          <button
            onClick={() => setView('draft')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] text-caption font-medium hover:bg-[var(--color-surface-tertiary)] transition-colors duration-150 cursor-pointer"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <span className="min-w-0 flex-1 text-center break-words">View AI draft</span>
            <ArrowRight size={13} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
          </button>
        ) : (
          <button
            id="ext-compose-manually-btn"
            onClick={onComposeManually}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] text-caption font-medium hover:bg-[var(--color-surface-tertiary)] transition-colors duration-150 cursor-pointer"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <Edit2 size={13} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 text-center break-words">Compose reply manually</span>
          </button>
        )}
      </div>
    </div>
  )
}

function ContextItem({ icon, label, available }: {
  icon: React.ReactNode
  label: string
  available: boolean
}) {
  return (
    <li className="flex items-center gap-2.5">
      <span className={available ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>{icon}</span>
      <span className="text-caption text-[var(--color-text-secondary)]">{label}</span>
      <span className={`ml-auto text-small font-medium ${available ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
        {available ? 'Available' : 'Missing'}
      </span>
    </li>
  )
}
