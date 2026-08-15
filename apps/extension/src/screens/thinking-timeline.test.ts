import { describe, it, expect } from 'vitest'
import { stageAt, isOvertime, isVisible, poolAt, pickLine } from './thinking-timeline'
import { STAGES, OVERTIME_LINES, TOTAL_DURATION, THINKING_DELAY_MS } from './thinking-copy'

describe('stageAt', () => {
  it('starts on the first stage', () => {
    expect(stageAt(0)).toBe(0)
    expect(stageAt(STAGES[0].duration - 1)).toBe(0)
  })

  it('advances through every stage in order', () => {
    let elapsed = 0
    for (let i = 0; i < STAGES.length; i++) {
      // Sample in the middle of each stage's window.
      expect(stageAt(elapsed + STAGES[i].duration / 2)).toBe(i)
      elapsed += STAGES[i].duration
    }
  })

  it('holds on the last stage instead of running off the end', () => {
    expect(stageAt(TOTAL_DURATION)).toBe(STAGES.length - 1)
    expect(stageAt(TOTAL_DURATION + 60_000)).toBe(STAGES.length - 1)
  })
})

describe('isVisible', () => {
  it('hides during the grace period so cached responses do not flash', () => {
    expect(isVisible(0)).toBe(false)
    expect(isVisible(THINKING_DELAY_MS - 1)).toBe(false)
  })

  it('shows once the grace period elapses', () => {
    expect(isVisible(THINKING_DELAY_MS)).toBe(true)
  })
})

describe('isOvertime', () => {
  it('is false inside the budget', () => {
    expect(isOvertime(TOTAL_DURATION - 1)).toBe(false)
  })

  it('is true past the budget', () => {
    expect(isOvertime(TOTAL_DURATION)).toBe(true)
  })
})

describe('poolAt', () => {
  it('uses the active stage lines inside the budget', () => {
    expect(poolAt(0)).toEqual(STAGES[0].lines)
  })

  it('switches to the overtime pool past the budget', () => {
    expect(poolAt(TOTAL_DURATION + 1)).toEqual(OVERTIME_LINES)
  })
})

describe('pickLine', () => {
  it('never repeats the previous line back to back', () => {
    const pool = ['a', 'b', 'c']
    // random() = 0 would pick index 0 ('a') from the full pool; filtering
    // 'a' out means it must return 'b' instead.
    expect(pickLine(pool, 'a', () => 0)).toBe('b')
  })

  it('falls back to the pool when every entry matches previous', () => {
    expect(pickLine(['only'], 'only', () => 0)).toBe('only')
  })

  it('always returns a member of the pool', () => {
    const pool = STAGES[1].lines
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(pool).toContain(pickLine(pool, '', () => r))
    }
  })
})

describe('copy safety', () => {
  it('has no empty lines', () => {
    for (const stage of STAGES) {
      for (const line of stage.lines) expect(line.trim().length).toBeGreaterThan(0)
    }
    for (const line of OVERTIME_LINES) expect(line.trim().length).toBeGreaterThan(0)
  })

  it('never claims a finding — activity only, no verifiable results', () => {
    // Guards the design rule: the frontend cannot know what was found, so a
    // line asserting results would be a lie rather than personality.
    const forbidden = /\bfound\b|\b\d+ (documents?|matches|results?)\b/i
    for (const stage of STAGES) {
      for (const line of stage.lines) expect(line).not.toMatch(forbidden)
    }
    for (const line of OVERTIME_LINES) expect(line).not.toMatch(forbidden)
  })

  it('stage keys mirror the backend graph nodes', () => {
    expect(STAGES.map((s) => s.key)).toEqual(['extract', 'match', 'compose', 'feedback'])
  })
})
