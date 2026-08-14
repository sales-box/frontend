export const CONFIDENCE_THRESHOLD = 60

/**
 * LEGACY FALLBACK — not the routing policy.
 *
 * `confidence.label` from the Supervisor is the authority (see `routing.ts`).
 * This OR-gate only runs when a response carries no label: a draft cached by
 * an older build of the extension, or a backend deployed before the label
 * shipped. It over-warns badly — history confidence is 0.4 until the third
 * logged interaction, so this fires on every new contact — which is exactly
 * why it must not be consulted when a real label is present.
 *
 * Do not add callers.
 */
export function isLowConfidence(scores: {
  productConfidence: number
  clientHistoryConfidence: number
  hasHallucination: boolean
}): boolean {
  return (
    scores.productConfidence < CONFIDENCE_THRESHOLD ||
    scores.clientHistoryConfidence < CONFIDENCE_THRESHOLD ||
    scores.hasHallucination
  )
}
