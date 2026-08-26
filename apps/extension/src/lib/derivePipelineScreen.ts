import type { BriefingData } from '../screens/BriefingSheet'
import type { LowConfidenceData } from '../screens/LowConfidenceScreen'
import type { RepliedSummary } from '../state/panelMachine'
import { CONFIDENCE_THRESHOLD, isLowConfidence } from './confidence'
import {
  labelToRouting,
  type LabelReason,
  type Routing,
  type SupervisorLabel,
} from './routing'

export interface PipelineResponse {
  alreadyReplied?: boolean
  notSalesbox?: boolean
  summary?: RepliedSummary | null
  draft?: { draftText?: string }
  confidence?: {
    productConfidence?: number
    clientHistoryConfidence?: number
    /** The Supervisor's routing decision — the authority for which screen shows. */
    label?: SupervisorLabel
    /** Which rule produced that label, so the screen can say why. */
    labelReason?: LabelReason
    hallucinationDetected?: boolean
  }
  /** The classifier row. Always on the wire; the panel just used to drop it. */
  classification?: {
    intent?: string
    intentConfidence?: number
    isUrgent?: boolean
    urgencyReason?: string | null
    supervisorLabel?: string | null
  }
  client?: { name?: string; company?: string; status?: string }
  emailTimestamp?: string
  graphThreadId?: string
}

export type DerivedScreen =
  | { kind: 'not-salesbox' }
  | { kind: 'replied'; summary: RepliedSummary | null }
  | { kind: 'briefing'; data: BriefingData }
  | { kind: 'low-confidence'; data: LowConfidenceData }

export function derivePipelineScreen(raw: PipelineResponse): DerivedScreen {
  if (raw.notSalesbox) {
    return { kind: 'not-salesbox' }
  }
  if (raw.alreadyReplied) {
    return { kind: 'replied', summary: raw.summary ?? null }
  }

  const conf = raw.confidence ?? {}
  const productConfidence = Math.round((conf.productConfidence ?? 0) * 100)
  const clientHistoryConfidence = Math.round((conf.clientHistoryConfidence ?? 0) * 100)
  const hasHallucination = conf.hallucinationDetected ?? false

  const routing = deriveRouting(raw, { productConfidence, clientHistoryConfidence, hasHallucination })

  const common = {
    clientName: raw.client?.name ?? 'Unknown',
    // An absent company is not useful customer-facing information. Keep the
    // value empty so the card can omit the line instead of presenting
    // "Unknown company" as though it were a real account name.
    company: raw.client?.company?.trim() ?? '',
    role: '',
    emailTimestamp: raw.emailTimestamp ?? new Date().toISOString(),
    productConfidence,
    clientHistoryConfidence,
    suggestedReply: raw.draft?.draftText ?? '',
    dealStatus: (raw.client?.status === 'active' ? 'active' : 'prospect') as 'active' | 'prospect',
    routing,
    intent: raw.classification?.intent ?? null,
    isUrgent: raw.classification?.isUrgent ?? false,
    labelReason: conf.labelReason ?? null,
  }

  if (routing === 'red') {
    return {
      kind: 'low-confidence',
      data: {
        ...common,
        missingContext: {
          hasProductDocs: productConfidence >= CONFIDENCE_THRESHOLD,
          hasPreviousEmails: clientHistoryConfidence >= CONFIDENCE_THRESHOLD,
          hasAccountHistory: clientHistoryConfidence >= 50,
        },
      },
    }
  }

  return { kind: 'briefing', data: common }
}

/**
 * Which screen to show, in strict precedence order.
 *
 * The backend already decided this — `confidence.label` is the Supervisor's
 * output and encodes policy the panel cannot see (sensitive intent, urgency,
 * how well we know the sender). Re-deriving it from the two scores is what
 * produced the "Manual review recommended" warning on nearly every email.
 */
function deriveRouting(
  raw: PipelineResponse,
  scores: {
    productConfidence: number
    clientHistoryConfidence: number
    hasHallucination: boolean
  },
): Routing {
  // A hallucinated draft is never sendable, whatever the label says. Kept as a
  // client-side veto so a version-skewed backend can't hand the green screen —
  // which has a one-click Send — a draft that contradicts the knowledge base.
  if (scores.hasHallucination) return 'red'

  const label = raw.confidence?.label
  if (label && label in labelToRouting) return labelToRouting[label]

  // No label: a draft cached by an older build, or a backend that predates it.
  // Fall back to the old OR-gate — it over-warns, but it never under-warns.
  return isLowConfidence(scores) ? 'red' : 'green'
}
