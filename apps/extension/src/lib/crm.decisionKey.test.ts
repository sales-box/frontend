import { describe, expect, it } from 'vitest'
import { decisionKey, type CrmSuggestion } from './crm'

const s = (over: Partial<CrmSuggestion> = {}): CrmSuggestion => ({
  index: 0,
  summary: 'Add a note',
  ...over,
})

describe('decisionKey', () => {
  it('keys on the tool call id when the backend sends one', () => {
    expect(decisionKey(s({ toolCallId: 'call_note' }))).toBe('call_note')
  })

  // An older backend sends no id; behaviour must be unchanged against it.
  it('falls back to the index when it does not', () => {
    expect(decisionKey(s({ index: 2 }))).toBe('index:2')
  })

  // The point of the change: after the list changes, an approval recorded for
  // the old action has no entry under the new one, so it defaults to reject and
  // nothing is written — rather than the approval landing on a different action.
  it('does not collide across two different actions at the same index', () => {
    const before = decisionKey(s({ index: 0, toolCallId: 'call_note' }))
    const after = decisionKey(s({ index: 0, toolCallId: 'call_task' }))
    expect(before).not.toBe(after)
  })

  it('does collide by index when neither carries an id — the old behaviour', () => {
    expect(decisionKey(s({ index: 0 }))).toBe(decisionKey(s({ index: 0 })))
  })
})
