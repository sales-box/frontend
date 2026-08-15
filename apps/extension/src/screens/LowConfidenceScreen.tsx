import { AlertTriangle, BookOpen, Users, Mail, Edit2, Building2, Star, Flag, CheckCircle2, XCircle, Database, ArrowLeft, ArrowRight, Send } from 'lucide-react'
import { useState } from 'react'
import { PanelHeader } from '../components/PanelHeader'
import { ConfidencePill } from '../components/ConfidencePill'
import { Badge } from '../components/Badge'
import { ClassificationBar } from '../components/ClassificationBar'
import { reasonText, type ClassificationInfo } from '../lib/routing'
import type { CrmSuggestionResult, CrmDecision } from '../lib/crm'

/** `routing` is always 'red' here — this screen IS the red state. */
export interface LowConfidenceData extends ClassificationInfo {
  clientName: string
  company: string
  role: string
  /** Real CRM status. New contacts use the concise "New" label. */
  dealStatus: 'active' | 'prospect'
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
  onReportGap: () => Promise<{ occurrences: number; reportAdded: boolean }>
  crmSuggestions?: CrmSuggestionResult | null
  onResolveCrmActions?: (decisions: CrmDecision[]) => void
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
export function LowConfidenceScreen({ data, onClose, onRefresh, onComposeManually, onInsertDraft, onReportGap, crmSuggestions, onResolveCrmActions }: LowConfidenceScreenProps) {
  const [view, setView] = useState<'summary' | 'draft'>('summary')
  const [reported, setReported] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportAdded, setReportAdded] = useState(false)

  // Per-suggestion decision map — defaults to 'reject' (ignore)
  const [crmDecisions, setCrmDecisions] = useState<Record<number, 'approve' | 'reject'>>(() => {
    const defaults: Record<number, 'approve' | 'reject'> = {}
    crmSuggestions?.suggestions.forEach(s => { defaults[s.index] = 'reject' })
    return defaults
  })

  const hasSuggestions =
    (crmSuggestions?.isPausedForApproval ?? false) &&
    (crmSuggestions?.suggestions.length ?? 0) > 0

  const handleCrmSubmit = () => {
    if (!crmSuggestions || !onResolveCrmActions) return
    const decisions = crmSuggestions.suggestions.map(s => ({
      type: crmDecisions[s.index] ?? 'reject',
    }))
    onResolveCrmActions(decisions)
  }

  const handleReportGap = async () => {
    if (reported || reporting) return
    setReporting(true)
    setReportError(null)
    try {
      const result = await onReportGap()
      setReportAdded(result.reportAdded)
      setReported(true)
    } catch (err) {
      console.error('[Copilot] reportKnowledgeGap failed:', err)
      setReportError('Could not report this gap. Please try again.')
    } finally {
      setReporting(false)
    }
  }

  const reportControl = reported ? (
    <p className="flex items-center justify-center gap-1.5 text-small text-[var(--color-success)]">
      <CheckCircle2 size={12} strokeWidth={1.5} aria-hidden="true" />
      {reportAdded
        ? 'Reported to admin ✅'
        : 'Already reported to admin ✅'}
    </p>
  ) : (
    <div className="flex flex-col items-center gap-1">
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
      {reportError && (
        <p className="text-small text-[var(--color-danger)] text-center">{reportError}</p>
      )}
    </div>
  )

  if (view === 'draft') {
    return (
      <div className="flex flex-col h-full bg-[var(--color-surface)]">
        <PanelHeader onClose={onClose} />

        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <button
            onClick={() => setView('summary')}
            aria-label="Back to briefing"
            className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <AlertTriangle size={14} strokeWidth={1.5} className="text-[var(--color-warning)] flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-subheading text-[var(--color-text-primary)] leading-none" style={{ fontFamily: 'var(--font-body)' }}>
              AI Draft — unverified
            </p>
            <p className="text-small text-[var(--color-text-tertiary)] leading-none mt-0.5">
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-[var(--color-text-on-primary)] text-caption font-semibold hover:bg-[var(--color-primary-hover)] transition-colors duration-150 cursor-pointer"
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

          {reportControl}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <PanelHeader showRefresh onRefresh={onRefresh} onClose={onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 pt-4 pb-4 border-b border-[var(--color-border)] bg-[var(--color-surface-tertiary)]">
          <p className="text-eyebrow mb-1.5">BRIEFING SHEET</p>
          <h1 className="text-heading text-[var(--color-text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            {data.clientName}
          </h1>
          {(data.company || data.role) && (
            <p className="text-caption text-[var(--color-text-secondary)] mb-2.5">
              <Building2 size={11} strokeWidth={1.5} className="inline mr-1 -mt-0.5" aria-hidden="true" />
              {data.company}
              {data.company && data.role && <span className="text-[var(--color-text-tertiary)]"> · </span>}
              {data.role && <span className="text-[var(--color-text-tertiary)]">{data.role}</span>}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <Badge variant={data.dealStatus === 'active' ? 'success' : 'muted'}>
              <Star size={9} strokeWidth={1.5} aria-hidden="true" />
              {data.dealStatus === 'active' ? 'Active deal' : 'New'}
            </Badge>
            <span className="text-small text-[var(--color-text-tertiary)] flex items-center gap-1 flex-shrink-0">
              {formatTimestamp(data.emailTimestamp)}
            </span>
          </div>

          <div className="mt-2">
            <ClassificationBar
              routing={data.routing}
              intent={data.intent}
              isUrgent={data.isUrgent}
              labelReason={data.labelReason}
            />
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
              {/* The reason, not an assumption. A sensitive thread lands here at
                  99% confidence — telling the SE the score is too low would
                  contradict the number displayed directly above it. */}
              <p className="text-small text-[var(--color-warning)]/80 leading-relaxed">
                {reasonText[data.labelReason ?? 'confidence']}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-[var(--color-border)]">
          <p className="text-eyebrow mb-3">AVAILABLE CONTEXT</p>
          <div className="flex flex-wrap gap-2" aria-label="Context sources available">
            <Badge variant={data.missingContext.hasProductDocs ? 'success' : 'danger'}>
              <BookOpen size={11} strokeWidth={1.5} aria-hidden="true" />
              Product documentation
            </Badge>
            <Badge variant={data.missingContext.hasPreviousEmails ? 'success' : 'danger'}>
              <Mail size={11} strokeWidth={1.5} aria-hidden="true" />
              Previous email threads
            </Badge>
            <Badge variant={data.missingContext.hasAccountHistory ? 'success' : 'danger'}>
              <Users size={11} strokeWidth={1.5} aria-hidden="true" />
              Account history
            </Badge>
          </div>
        </div>

        {/* ── CRM actions ── */}
        {hasSuggestions && (
          <div className="px-4 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-1.5 mb-3">
              <Database size={11} strokeWidth={1.5} className="text-[var(--color-text-tertiary)]" aria-hidden="true" />
              <p className="text-eyebrow">CRM ACTIONS</p>
            </div>

            <ul className="flex flex-col gap-2">
              {crmSuggestions!.suggestions.map((s) => {
                const decision = crmDecisions[s.index] ?? 'reject'
                const isApproved = decision === 'approve'
                return (
                  <li
                    key={s.index}
                    className="
                      flex items-start gap-2
                      p-2.5 rounded-[var(--radius-sm)]
                      border border-[var(--color-border)]
                      bg-[var(--color-surface-tertiary)]
                    "
                  >
                    <p
                      className="flex-1 text-small text-[var(--color-text-primary)] leading-snug"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {s.summary}
                    </p>

                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        id={`ext-lc-crm-approve-${s.index}`}
                        onClick={() => setCrmDecisions(prev => ({ ...prev, [s.index]: 'approve' }))}
                        title="Approve this action"
                        className={`
                          flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)]
                          text-small font-medium transition-all duration-150 cursor-pointer
                          ${isApproved
                            ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)]'
                            : 'border border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
                          }
                        `}
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        <CheckCircle2 size={11} strokeWidth={1.5} aria-hidden="true" />
                        Approve
                      </button>

                      <button
                        id={`ext-lc-crm-ignore-${s.index}`}
                        onClick={() => setCrmDecisions(prev => ({ ...prev, [s.index]: 'reject' }))}
                        title="Ignore this action"
                        className={`
                          flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)]
                          text-small font-medium transition-all duration-150 cursor-pointer
                          ${!isApproved
                            ? 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                            : 'border border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
                          }
                        `}
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        <XCircle size={11} strokeWidth={1.5} aria-hidden="true" />
                        Ignore
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>

            <button
              id="ext-lc-crm-submit-btn"
              onClick={handleCrmSubmit}
              className="
                mt-3 w-full flex items-center justify-center gap-1.5
                px-3 py-2 rounded-[var(--radius-sm)]
                border border-[var(--color-border-focus)]
                text-[var(--color-primary)] text-small font-medium
                hover:bg-[var(--color-surface-tertiary)]
                transition-colors duration-150 cursor-pointer
              "
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Submit CRM decisions
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-[var(--color-border)] flex flex-col gap-2.5 flex-shrink-0">
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
        {reportControl}
      </div>
    </div>
  )
}
