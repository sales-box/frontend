import { describe, it, expect } from 'vitest'
import { panelReducer, initialPanelState } from './panelMachine'

describe('panelReducer', () => {
  it('EXPAND from collapsed → auth', () => {
    expect(panelReducer({ type: 'collapsed' }, { type: 'EXPAND' })).toEqual({ type: 'auth' })
  })

  it('SHOW_CATEGORY_LIST initializes emails empty and loading true', () => {
    const data = { totalEmails: 0, syncedAt: 'x' } as any
    const next = panelReducer(
      { type: 'overview', data },
      { type: 'SHOW_CATEGORY_LIST', category: 'demo-request', data },
    )
    expect(next).toEqual({
      type: 'category-list',
      category: 'demo-request',
      parent: data,
      emails: [],
      loading: true,
    })
  })

  it('CATEGORY_LOADED preserves category + parent, updates emails, loading=false', () => {
    const data = { totalEmails: 0, syncedAt: 'x' } as any
    const emails = [{ threadId: 't1', clientName: 'A', company: 'B', subjectSnippet: 's', timestamp: 'x' }] as any
    const start = panelReducer({ type: 'overview', data }, { type: 'SHOW_CATEGORY_LIST', category: 'demo-request', data })
    const next = panelReducer(start, { type: 'CATEGORY_LOADED', emails })
    expect(next).toMatchObject({ type: 'category-list', category: 'demo-request', parent: data, emails, loading: false })
  })

  it('CATEGORY_FAILED sets error message and loading=false, keeps category', () => {
    const data = { totalEmails: 0, syncedAt: 'x' } as any
    const start = panelReducer({ type: 'overview', data }, { type: 'SHOW_CATEGORY_LIST', category: 'demo-request', data })
    const next = panelReducer(start, { type: 'CATEGORY_FAILED', message: 'oops' })
    expect(next).toMatchObject({ type: 'category-list', category: 'demo-request', parent: data, loading: false, error: 'oops' })
  })

  it('CATEGORY_* actions on non-category state are ignored (state unchanged)', () => {
    const data = { totalEmails: 0, syncedAt: 'x' } as any
    const state = { type: 'overview' as const, data }
    expect(panelReducer(state, { type: 'CATEGORY_LOADING' })).toBe(state)
  })

  it('initialPanelState is collapsed', () => {
    expect(initialPanelState).toEqual({ type: 'collapsed' })
  })

  it('unknown action returns state unchanged', () => {
    const state: any = { type: 'collapsed' }
    expect(panelReducer(state, { type: 'BOGUS' } as any)).toBe(state)
  })
})
