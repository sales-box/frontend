import { describe, it, expect } from 'vitest'
import { describeCrmSubmitError } from './crm'

describe('describeCrmSubmitError', () => {
  it('names the fixable cause for 404 — every 404 on this route is a missing CRM connection', () => {
    const msg = describeCrmSubmitError(404)
    expect(msg).toContain('no longer connected')
    expect(msg).toContain('Reconnect')
  })

  it('tells the SE to wait on 429 rather than retrying immediately', () => {
    expect(describeCrmSubmitError(429)).toContain('Wait a moment')
  })

  it('treats 408 and 504 as timeouts', () => {
    expect(describeCrmSubmitError(408)).toContain('timed out')
    expect(describeCrmSubmitError(504)).toContain('timed out')
  })

  it('reassures that nothing was written on a server error', () => {
    expect(describeCrmSubmitError(500)).toContain('Nothing was written')
    expect(describeCrmSubmitError(503)).toContain('Nothing was written')
  })

  it('reads as a connectivity problem when the request never got a status', () => {
    expect(describeCrmSubmitError(undefined)).toContain('Could not reach the server')
  })

  it('falls back to a plain sentence for an unmapped 4xx', () => {
    expect(describeCrmSubmitError(418)).toContain('Could not submit these actions')
  })

  it('never leaks an HTTP code or an internal message type to the SE', () => {
    for (const status of [404, 408, 429, 500, 503, 504, 418, undefined]) {
      const msg = describeCrmSubmitError(status)
      expect(msg).not.toMatch(/\b[45]\d{2}\b/)
      expect(msg).not.toContain('RESUME_CRM_ACTIONS')
      expect(msg).toMatch(/[.!]$/)
    }
  })
})
