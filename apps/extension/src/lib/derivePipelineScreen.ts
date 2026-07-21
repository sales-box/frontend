import type { BriefingData } from '../screens/BriefingSheet'
import type { LowConfidenceData } from '../screens/LowConfidenceScreen'
import type { RepliedSummary } from '../state/panelMachine'
import { CONFIDENCE_THRESHOLD, isLowConfidence } from './confidence'

export interface PipelineResponse {
  alreadyReplied?: boolean
  summary?: RepliedSummary | null
  draft?: { draftText?: string }
  confidence?: {
    productConfidence?: number
    clientHistoryConfidence?: number
    hallucinationDetected?: boolean
  }
  client?: { name?: string; company?: string; status?: string }
  emailTimestamp?: string
}

export type DerivedScreen =
  | { kind: 'replied'; summary: RepliedSummary | null }
  | { kind: 'briefing'; data: BriefingData }
  | { kind: 'low-confidence'; data: LowConfidenceData }

export function derivePipelineScreen(raw: PipelineResponse): DerivedScreen {
  if (raw.alreadyReplied) {
    return { kind: 'replied', summary: raw.summary ?? null }
  }

  const conf = raw.confidence ?? {}
  const productConfidence = Math.round((conf.productConfidence ?? 0) * 100)
  const clientHistoryConfidence = Math.round((conf.clientHistoryConfidence ?? 0) * 100)
  const hasHallucination = conf.hallucinationDetected ?? false

  const common = {
    clientName: raw.client?.name ?? 'Unknown',
    company: raw.client?.company ?? 'Unknown company',
    role: '',
    emailTimestamp: raw.emailTimestamp ?? new Date().toISOString(),
    productConfidence,
    clientHistoryConfidence,
    suggestedReply: raw.draft?.draftText ?? '',
  }

  if (isLowConfidence({ productConfidence, clientHistoryConfidence, hasHallucination })) {
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

  return {
    kind: 'briefing',
    data: {
      ...common,
      dealStatus: (raw.client?.status === 'active' ? 'active' : 'prospect') as 'active' | 'prospect',
    },
  }
}
