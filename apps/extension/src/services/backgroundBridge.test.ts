import { describe, it, expect, vi } from 'vitest'
import { sendToBackground, handleAuthErr } from './backgroundBridge'

describe('sendToBackground — response shape mapping', () => {
  it('undefined response → ok:false, kind:error', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce(undefined)
    const res = await sendToBackground({ type: 'GET_INBOX_STATS' })
    expect(res).toEqual({
      ok: false,
      kind: 'error',
      message: 'No response from the extension background',
    })
  })

  it('response with status 401 → ok:false, kind:unauthorized', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({ error: 'unauth', status: 401 })
    const res = await sendToBackground({ type: 'GET_INBOX_STATS' })
    expect(res).toEqual({ ok: false, kind: 'unauthorized' })
  })

  it('response with status 403 → ok:false, kind:revoked', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({ error: 'revoked', status: 403 })
    const res = await sendToBackground({ type: 'GET_INBOX_STATS' })
    expect(res).toEqual({ ok: false, kind: 'revoked' })
  })

  it('response with only error → ok:false, kind:error, message passthrough', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({ error: 'boom' })
    const res = await sendToBackground({ type: 'GET_INBOX_STATS' })
    expect(res).toEqual({ ok: false, kind: 'error', message: 'boom' })
  })

  it('successful response → ok:true, data passthrough', async () => {
    const payload = { totalEmails: 42, syncedAt: '2026-07-21T00:00:00Z' }
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce(payload)
    const res = await sendToBackground<typeof payload>({ type: 'GET_INBOX_STATS' })
    expect(res).toEqual({ ok: true, data: payload })
  })
})

describe('handleAuthErr', () => {
  it('unauthorized → clears session, dispatches RESET, returns true', async () => {
    const dispatch = vi.fn()
    // Prime storage so we can verify it's cleared
    await chrome.storage.local.set({ jwt: 'x', tenantId: 't', accountEmail: 'a@b', cachedInboxStats: {} })
    const handled = await handleAuthErr({ ok: false, kind: 'unauthorized' }, dispatch)
    expect(handled).toBe(true)
    expect(dispatch).toHaveBeenCalledWith({ type: 'RESET' })
    const after = await chrome.storage.local.get(['jwt', 'tenantId', 'accountEmail', 'cachedInboxStats'])
    expect(after).toEqual({ jwt: undefined, tenantId: undefined, accountEmail: undefined, cachedInboxStats: undefined })
  })

  it('revoked → clears session, dispatches REVOKED, returns true', async () => {
    const dispatch = vi.fn()
    const handled = await handleAuthErr({ ok: false, kind: 'revoked' }, dispatch)
    expect(handled).toBe(true)
    expect(dispatch).toHaveBeenCalledWith({ type: 'REVOKED' })
  })

  it('ok response → returns false, no dispatch, no session change', async () => {
    const dispatch = vi.fn()
    const handled = await handleAuthErr({ ok: true, data: {} }, dispatch)
    expect(handled).toBe(false)
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('generic error → returns false, no dispatch', async () => {
    const dispatch = vi.fn()
    const handled = await handleAuthErr({ ok: false, kind: 'error', message: 'boom' }, dispatch)
    expect(handled).toBe(false)
    expect(dispatch).not.toHaveBeenCalled()
  })
})
