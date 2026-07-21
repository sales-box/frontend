import type React from 'react'
import type { PanelAction } from '../state/panelMachine'
import { clearSession } from '../state/session'

export type BgRequest =
  | { type: 'GET_INBOX_STATS' }
  | { type: 'PROCESS_EMAIL'; messageId: string }
  | { type: 'GET_CATEGORIZED_EMAILS'; category: string }
  | { type: 'GET_SE_AUTH_CODE' }
  | { type: 'SE_LOGIN'; code: string; redirectUri: string }
  | { type: 'GET_AUTH_ME'; jwt: string }
  | { type: 'REPORT_KNOWLEDGE_GAP'; jwt: string; topic: string }

export type BgResponse<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'unauthorized' }
  | { ok: false; kind: 'revoked' }
  | { ok: false; kind: 'error'; message: string }

export async function sendToBackground<T>(req: BgRequest): Promise<BgResponse<T>> {
  const raw = await chrome.runtime.sendMessage(req)
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
