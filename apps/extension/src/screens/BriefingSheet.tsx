import { useState } from 'react'
import { Clock, Send, Edit2, Building2, Star, CheckCircle2, XCircle, Database } from 'lucide-react'
import { PanelHeader } from '../components/PanelHeader'
import { ConfidencePill } from '../components/ConfidencePill'
import { Badge } from '../components/Badge'

export interface BriefingData {
  clientName: string
  company: string
  role: string
  /** e.g. "Active deal" | "New prospect" */
  dealStatus: 'active' | 'prospect'
  /** ISO timestamp */
  emailTimestamp: string
  productConfidence: number   // 0–100
  clientHistoryConfidence: number   // 0–100
  suggestedReply: string
}

export interface CrmSuggestion {
  index: number
  summary: string
}

export interface CrmSuggestionResult {
  threadId: string
  isPausedForApproval: boolean
  suggestions: CrmSuggestion[]
}

interface BriefingSheetProps {
  data: BriefingData
  onClose: () => void
  onRefresh: () => void
  onSend: (reply: string) => void
  onEditInGmail: (reply: string) => void
  crmSuggestions?: CrmSuggestionResult | null
  onResolveCrmActions?: (decisions: Array<{ type: 'approve' | 'reject' }>) => void
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
 * The product moment — richest screen in the extension.
 *
 * DESIGN.md serif moments (E4):
 *   • Client name → text-heading (Fraunces)
 *   • Confidence scores → ConfidencePill with text-numeral-display (Fraunces, the ONE hero stat)
 *   • Eyebrow labels above each serif element
 *
 * Everything else (company, role, timestamp, reply body) → Inter body/caption.
 *
 */
export function BriefingSheet({ data, onClose, onRefresh, onSend, onEditInGmail, crmSuggestions, onResolveCrmActions }: BriefingSheetProps) {
  const [reply, setReply] = useState(data.suggestedReply)
  // Defaults to 'reject' (ignore) — the user must explicitly approve.
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

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <PanelHeader showRefresh onRefresh={onRefresh} onClose={onClose} />

      {/* ── Client card ── */}
      <div className="px-4 pt-4 pb-4 border-b border-[var(--color-border)] bg-[var(--color-surface-tertiary)]">
        {/* Eyebrow above serif heading */}
        <p className="text-eyebrow mb-1.5">BRIEFING SHEET</p>

        {/* CLIENT NAME — the ONE serif heading moment */}
        <h1
          className="text-heading text-[var(--color-text-primary)] mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {data.clientName}
        </h1>

        {/* Company · Role — body text, Inter */}
        <p className="text-caption text-[var(--color-text-secondary)] mb-2.5">
          <Building2 size={11} strokeWidth={1.5} className="inline mr-1 -mt-0.5" aria-hidden="true" />
          {data.company}
          {data.role && <span className="text-[var(--color-text-tertiary)]"> · {data.role}</span>}
        </p>

        {/* Deal status badge + timestamp */}
        <div className="flex items-center justify-between">
          <Badge variant={data.dealStatus === 'active' ? 'success' : 'muted'}>
            <Star size={9} strokeWidth={1.5} aria-hidden="true" />
            {data.dealStatus === 'active' ? 'Active deal' : 'New prospect'}
          </Badge>
          <span className="text-small text-[var(--color-text-tertiary)] flex items-center gap-1">
            <Clock size={10} strokeWidth={1.5} aria-hidden="true" />
            {formatTimestamp(data.emailTimestamp)}
          </span>
        </div>
      </div>

      {/* ── Confidence section ── */}
      <div className="px-4 py-4 border-b border-[var(--color-border)]">
        <p className="text-eyebrow mb-3">AI CONFIDENCE</p>
        {/* The TWO numeral-display elements — the single hero stat per DESIGN.md */}
        <div className="flex gap-3">
          <div className="flex-1">
            <ConfidencePill label="PRODUCT" pct={data.productConfidence} />
          </div>
          <div className="flex-1">
            <ConfidencePill label="HISTORY" pct={data.clientHistoryConfidence} />
          </div>
        </div>
      </div>

      {/* ── Suggested reply ── */}
      <div className="px-4 py-4 flex-1 flex flex-col min-h-0">
        <p className="text-eyebrow mb-2">SUGGESTED REPLY</p>
        <textarea
          id="ext-reply-textarea"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="
            flex-1 resize-none w-full
            text-body text-[var(--color-text-primary)]
            bg-[var(--color-surface-tertiary)]
            border border-[var(--color-border)]
            rounded-[var(--radius-lg)]
            px-3 py-3
            outline-none
            focus:border-[var(--color-border-focus)]
            transition-colors duration-150
            min-h-[120px]
          "
          style={{ fontFamily: 'var(--font-body)', lineHeight: '1.6', fontSize: '0.875rem' }}
          placeholder="Your reply…"
          aria-label="Suggested reply — edit before sending"
        />
      </div>

      {/* ── CRM actions ── */}
      {hasSuggestions && (
        <div className="px-4 py-4 border-t border-[var(--color-border)] flex-shrink-0">
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
                  {/* Summary text */}
                  <p
                    className="flex-1 text-small text-[var(--color-text-primary)] leading-snug"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {s.summary}
                  </p>

                  {/* Approve / Ignore toggle buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      id={`ext-crm-approve-${s.index}`}
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
                      id={`ext-crm-ignore-${s.index}`}
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

          {/* Submit decisions */}
          <button
            id="ext-crm-submit-btn"
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

      {/* ── Footer actions ── */}
      <div className="px-4 py-3 border-t border-[var(--color-border)] flex gap-2.5 flex-shrink-0">
        {/* PRIMARY — ink fill, ONE per view */}
        <button
          id="ext-send-btn"
          onClick={() => onSend(reply)}
          className="
            flex-1 flex items-center justify-center gap-2
            px-4 py-2.5 rounded-[var(--radius-sm)]
            bg-[var(--color-primary)] text-[var(--color-text-on-primary)]
            text-caption font-medium
            hover:bg-[var(--color-primary-hover)]
            active:translate-y-px
            transition-all duration-150
            cursor-pointer
          "
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <Send size={13} strokeWidth={1.5} aria-hidden="true" />
          Send
        </button>

        {/* SECONDARY — ghost */}
        <button
          id="ext-edit-gmail-btn"
          onClick={() => onEditInGmail(reply)}
          className="
            flex items-center gap-1.5
            px-3 py-2.5 rounded-[var(--radius-sm)]
            border border-[var(--color-border)]
            bg-transparent text-[var(--color-text-primary)]
            text-caption font-medium
            hover:bg-[var(--color-surface-tertiary)]
            transition-colors duration-150
            cursor-pointer
            whitespace-nowrap
          "
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <Edit2 size={13} strokeWidth={1.5} aria-hidden="true" />
          Edit in Gmail
        </button>
      </div>
    </div>
  )
}
