import type React from 'react'
import type { PanelAction } from '../state/panelMachine'
import { clearSession } from '../state/session'
import type { CrmDecision } from '../lib/crm'

export type BgRequest =
  | { type: 'GET_INBOX_STATS' }
  | { type: 'PROCESS_EMAIL'; messageId: string }
  | { type: 'SUBMIT_FEEDBACK'; graphThreadId: string; content: string }
  | { type: 'GET_CATEGORIZED_EMAILS'; category: string }
  | { type: 'GET_SE_AUTH_CODE' }
  | { type: 'SE_LOGIN'; code: string; redirectUri: string }
  | { type: 'GET_AUTH_ME'; jwt: string }
  | { type: 'REPORT_KNOWLEDGE_GAP'; messageId: string }
  | { type: 'SUGGEST_CRM_ACTIONS'; messageId: string }
  | { type: 'RESUME_CRM_ACTIONS'; threadId: string; decisions: CrmDecision[] }

export type BgResponse<T> =
  | { ok: true; data: T; kind?: never }
  | { ok: false; kind: 'unauthorized' }
  | { ok: false; kind: 'revoked' }
  | { ok: false; kind: 'error'; message: string }

export async function sendToBackground<T>(req: BgRequest): Promise<BgResponse<T>> {
  let raw: unknown
  try {
    raw = await chrome.runtime.sendMessage(req)
  } catch (err) {
    // MV3 rejects this promise with chrome.runtime.lastError when the service
    // worker is torn down under a pending request, or when the extension was
    // reloaded and this tab still holds the old content script. Left uncaught,
    // the message reached the panel verbatim: "A listener indicated an
    // asynchronous response by returning true, but the message channel closed
    // before a response was received" — Chrome internals, naming concepts that
    // exist nowhere in the product. The union already has a case for this.
    console.error('[Copilot] background channel closed:', err)
    return {
      ok: false,
      kind: 'error',
      message: 'Lost contact with the extension. Reload this Gmail tab and try again.',
    }
  }

  if (raw === undefined || raw === null) {
    return { ok: false, kind: 'error', message: 'No response from the extension background' }
  }
  if (typeof raw === 'object' && 'error' in raw) {
    const status = (raw as { status?: number }).status
    if (status === 401) return { ok: false, kind: 'unauthorized' }
    if (status === 403) return { ok: false, kind: 'revoked' }
    return { ok: false, kind: 'error', message: String((raw as { error: unknown }).error) }
  }
  return { ok: true, data: raw as T }
}

/**
 * If the response is an auth error, clear the session and dispatch the matching
 * action. Returns true if handled (caller should return early), false otherwise.
 * Mirrors the pattern that used to be inlined at App.tsx:122-131, 163-170, 460-467.
 */
export async function handleAuthErr(
  res: BgResponse<unknown>,
  dispatch: React.Dispatch<PanelAction>,
): Promise<boolean> {
  if (res.ok) return false
  if (res.kind === 'unauthorized') {
    await clearSession()
    dispatch({ type: 'RESET' })
    return true
  }
  if (res.kind === 'revoked') {
    await clearSession()
    dispatch({ type: 'REVOKED' })
    return true
  }
  return false
}
