import { describe, it, expect } from 'vitest'
import { panelReducer } from './panelMachine'

/**
 * `loading` covers two very different waits — a ~445ms inbox-stats fetch and
 * a ~20s AI draft. These assert the discriminator that keeps the 20s mascot
 * treatment off the fast path.
 */
describe('panelReducer — loading kind', () => {
  it('LOAD_BRIEFING marks the long AI wait', () => {
    expect(panelReducer({ type: 'auth' }, { type: 'LOAD_BRIEFING' })).toEqual({
      type: 'loading',
      kind: 'briefing',
    })
  })

  it('AUTH_SUCCESS marks the quick wait', () => {
    expect(panelReducer({ type: 'auth' }, { type: 'AUTH_SUCCESS' })).toEqual({
      type: 'loading',
      kind: 'quick',
    })
  })

  it('the two waits are distinguishable', () => {
    const briefing = panelReducer({ type: 'auth' }, { type: 'LOAD_BRIEFING' })
    const quick = panelReducer({ type: 'auth' }, { type: 'AUTH_SUCCESS' })
    expect(briefing).not.toEqual(quick)
  })
})
