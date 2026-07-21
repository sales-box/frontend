import { describe, it, expect } from 'vitest'
import { CONFIDENCE_THRESHOLD, isLowConfidence } from './confidence'

describe('isLowConfidence', () => {
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
})
