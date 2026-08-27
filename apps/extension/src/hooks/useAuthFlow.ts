import { useCallback } from 'react'
import type React from 'react'
import type { PanelAction } from '../state/panelMachine'
import type { InboxOverviewData } from '../screens/InboxOverviewScreen'
import { sendToBackground, type BgResponse } from '../services/backgroundBridge'
import { setSession } from '../state/session'

export interface AuthFlowHooks {
  /** Runs the full sign-in chain: OAuth code → SE login → GET_AUTH_ME → GET_INBOX_STATS. */
  signIn: () => Promise<void>
}

/**
 * Every step of the chain below lands on the same "invalid" screen, so a
 * backend that never answered used to be reported to the SE as an account that
 * was turned away. `unreachableHost` sends the screen to the connectivity copy
 * instead, and names the host so a mismatched API base is visible on sight.
 */
function authFailed(res: Extract<BgResponse<unknown>, { ok: false }>, step: string): PanelAction {
  if (res.kind === 'unreachable') return { type: 'AUTH_FAILED', unreachableHost: res.host }
  return { type: 'AUTH_FAILED', errorMsg: `${step}: ${res.kind === 'error' ? res.message : res.kind}` }
}

export function useAuthFlow(dispatch: React.Dispatch<PanelAction>): AuthFlowHooks {
  const signIn = useCallback(async () => {
    try {
      const codeRes = await sendToBackground<{ code: string; redirectUri: string }>({ type: 'GET_SE_AUTH_CODE' })
      if (!codeRes.ok) {
        console.error('[Copilot] Failed to get auth code:', codeRes)
        dispatch(authFailed(codeRes, 'OAuth Error'))
        return
      }

      const resultRes = await sendToBackground<{ token: string }>({
        type: 'SE_LOGIN',
        code: codeRes.data.code,
        redirectUri: codeRes.data.redirectUri,
      })

      if (!resultRes.ok) {
        console.error('[Copilot] Backend login failed:', resultRes)
        dispatch(authFailed(resultRes, 'Backend Login'))
        return
      }

      dispatch({ type: 'AUTH_SUCCESS' })

      const authMeRes = await sendToBackground<{ tenantId: string; email: string }>({
        type: 'GET_AUTH_ME',
        jwt: resultRes.data.token,
      })

      if (!authMeRes.ok) {
        console.error('[Copilot] getAuthMe failed:', authMeRes)
        dispatch(authFailed(authMeRes, 'Auth Me'))
        return
      }

      const tenantId = authMeRes.data.tenantId
      const accountEmail = authMeRes.data.email
      await setSession({ jwt: resultRes.data.token, tenantId, accountEmail })

      const statsRes = await sendToBackground<InboxOverviewData>({ type: 'GET_INBOX_STATS' })
      if (!statsRes.ok) {
        console.error('[Copilot] Inbox stats failed:', statsRes)
        dispatch(authFailed(statsRes, 'Inbox Stats'))
        return
      }

      await setSession({ cachedInboxStats: statsRes.data })

      dispatch({ type: 'SHOW_OVERVIEW', data: statsRes.data })
    } catch (err) {
      console.error('[Copilot] Login flow failed:', err)
      dispatch({ type: 'AUTH_FAILED', errorMsg: err instanceof Error ? err.message : String(err) })
    }
  }, [dispatch])

  return { signIn }
}
