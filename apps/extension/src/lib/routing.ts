/**
 * The Supervisor's vocabulary, mirrored client-side.
 *
 * The panel used to re-derive its own routing policy from the two confidence
 * scores (a 60/60 OR-gate in `confidence.ts`) while the backend graded on
 * 0.8/0.6 of the product score alone. Two policies, one screen, and the
 * frontend's won — which is why "Manual review recommended" showed up on
 * almost every email. `label` is now the single authority; these types exist
 * so consuming it stays type-safe.
 *
 * Keep in sync with `backend/src/modules/ai/dto/process-email-response.dto.ts`.
 */

export type SupervisorLabel =
  | 'auto_worthy'
  | 'needs_review'
  | 'handle_manually'

export type LabelReason =
  | 'pipeline_error'
  | 'hallucination'
  | 'sensitive_intent'
  | 'urgent'
  | 'thin_history'
  | 'confidence'

/** The colour the backend persists as `GeneralAnalysis.supervisorLabel`. */
export type Routing = 'green' | 'yellow' | 'red'

export const labelToRouting: Record<SupervisorLabel, Routing> = {
  auto_worthy: 'green',
  needs_review: 'yellow',
  handle_manually: 'red',
}

/** What the SE sees on the badge. */
export const routingText: Record<Routing, string> = {
  green: 'Auto-worthy',
  yellow: 'Needs review',
  red: 'Manual reply',
}

/**
 * Why the thread was held back. Without this the panel can only show
 * "Manual reply" next to a 98% confidence score, which reads as a bug rather
 * than as a policy.
 */
export const reasonText: Record<LabelReason, string> = {
  pipeline_error: "The AI couldn't finish drafting this one. Nothing was generated — write it yourself.",
  hallucination: 'A claim in the draft contradicts the knowledge base.',
  sensitive_intent: 'Sensitive topic — these always go to a person.',
  urgent: 'Flagged urgent — worth a read before it goes out.',
  thin_history: "We've barely corresponded with this contact yet.",
  confidence: 'Confidence is below the safe threshold. The suggestion may be inaccurate.',
}

/** Classification signals shared by every briefing screen. */
export interface ClassificationInfo {
  routing: Routing
  /** Classifier intent, e.g. "product inquiry". Null on a stale cached blob. */
  intent: string | null
  isUrgent: boolean
  /** Null when the response predates `labelReason`. */
  labelReason: LabelReason | null
}
