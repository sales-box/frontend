import { useCallback } from 'react'
import type React from 'react'
import type { PanelAction } from '../state/panelMachine'
import type { InboxOverviewData } from '../screens/InboxOverviewScreen'
import { sendToBackground } from '../services/backgroundBridge'
import { setSession } from '../state/session'

export interface AuthFlowHooks {
  /** Runs the full sign-in chain: OAuth code → SE login → GET_AUTH_ME → GET_INBOX_STATS. */
  signIn: () => Promise<void>
}

export function useAuthFlow(dispatch: React.Dispatch<PanelAction>): AuthFlowHooks {
  const signIn = useCallback(async () => {
    try {
      const codeRes = await sendToBackground<{ code: string; redirectUri: string }>({ type: 'GET_SE_AUTH_CODE' })
      if (!codeRes.ok) {
        const msg = codeRes.kind === 'error' ? codeRes.message : codeRes.kind
        console.error('[Copilot] Failed to get auth code:', msg)
        dispatch({ type: 'AUTH_FAILED', errorMsg: `OAuth Error: ${msg}` })
        return
      }

      const resultRes = await sendToBackground<{ token: string }>({
        type: 'SE_LOGIN',
        code: codeRes.data.code,
        redirectUri: codeRes.data.redirectUri,
      })

      if (!resultRes.ok) {
        const msg = resultRes.kind === 'error' ? resultRes.message : resultRes.kind
        console.error('[Copilot] Backend login failed:', msg)
        dispatch({ type: 'AUTH_FAILED', errorMsg: `Backend Login: ${msg}` })
        return
      }

      dispatch({ type: 'AUTH_SUCCESS' })

      const authMeRes = await sendToBackground<{ tenantId: string; email: string }>({
        type: 'GET_AUTH_ME',
        jwt: resultRes.data.token,
      })

      if (!authMeRes.ok) {
        const msg = authMeRes.kind === 'error' ? authMeRes.message : authMeRes.kind
        console.error('[Copilot] getAuthMe failed:', msg)
        dispatch({ type: 'AUTH_FAILED', errorMsg: `Auth Me: ${msg}` })
        return
      }

      const tenantId = authMeRes.data.tenantId
      const accountEmail = authMeRes.data.email
      await setSession({ jwt: resultRes.data.token, tenantId, accountEmail })

      const statsRes = await sendToBackground<InboxOverviewData>({ type: 'GET_INBOX_STATS' })
      if (!statsRes.ok) {
        const msg = statsRes.kind === 'error' ? statsRes.message : statsRes.kind
        console.error('[Copilot] Inbox stats failed:', msg)
        dispatch({ type: 'AUTH_FAILED', errorMsg: `Inbox Stats: ${msg}` })
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
