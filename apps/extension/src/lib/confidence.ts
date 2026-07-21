export const CONFIDENCE_THRESHOLD = 60

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
