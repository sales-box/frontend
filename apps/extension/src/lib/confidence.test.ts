import { describe, it, expect } from 'vitest'
import { CONFIDENCE_THRESHOLD, isLowConfidence } from './confidence'

// isLowConfidence is no longer the routing policy — `confidence.label` is (see
// derivePipelineScreen.test.ts). These tests pin its remaining job: the
// fallback for a response that carries no label, where over-warning is the
// deliberate, safe behaviour.
describe('isLowConfidence (legacy fallback)', () => {
  it('exactly at threshold (60) is not low', () => {
    expect(isLowConfidence({ productConfidence: 60, clientHistoryConfidence: 60, hasHallucination: false })).toBe(false)
  })
  it('one below threshold (59) is low', () => {
    expect(isLowConfidence({ productConfidence: 59, clientHistoryConfidence: 90, hasHallucination: false })).toBe(true)
  })
  it('client history below threshold is low', () => {
    expect(isLowConfidence({ productConfidence: 90, clientHistoryConfidence: 40, hasHallucination: false })).toBe(true)
  })
  it('hallucination flag overrides high scores', () => {
    expect(isLowConfidence({ productConfidence: 95, clientHistoryConfidence: 95, hasHallucination: true })).toBe(true)
  })
  it('threshold constant is 60', () => {
    expect(CONFIDENCE_THRESHOLD).toBe(60)
  })
  it('over-warns on a fresh contact — why it is a fallback and not the policy', () => {
    // 40 is the supervisor's floor for anyone with fewer than 3 interactions,
    // so this gate red-flagged a perfectly grounded draft on every new client.
    expect(isLowConfidence({ productConfidence: 96, clientHistoryConfidence: 40, hasHallucination: false })).toBe(true)
  })
})
