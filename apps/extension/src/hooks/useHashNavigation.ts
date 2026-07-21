import { useEffect } from 'react'
import type React from 'react'
import type { PanelAction, PanelState } from '../state/panelMachine'
import { getSession } from '../state/session'

interface Options {
  panelType: PanelState['type']
  dispatch: React.Dispatch<PanelAction>
  resolveMessageId: () => Promise<string | null>
  getCurrentAccount: () => string | null
  getCurrentMessageId: () => string | null
  fetchStats: () => Promise<void>
  loadBriefing: (tenantId: string, messageId: string) => Promise<void>
}

export function useHashNavigation({
  panelType, dispatch, resolveMessageId, getCurrentAccount, getCurrentMessageId, fetchStats, loadBriefing,
}: Options) {
  useEffect(() => {
    const handler = async () => {
      if (panelType === 'collapsed' || panelType === 'auth' || panelType === 'invalid' || panelType === 'revoked') return

      const { tenantId, accountEmail } = await getSession()
      if (!tenantId) return

      const connected = accountEmail ? String(accountEmail).toLowerCase() : null
      const current = getCurrentAccount()
      if (connected) {
        if (current === null) return         // fail closed: don't proceed with the previous account's session
        if (current !== connected) { dispatch({ type: 'COLLAPSE' }); return }
      }

      // Thread URL ends in a long id — as the LAST segment, whatever the view.
      const inThread = /\/[A-Za-z0-9_-]{16,}$/.test(window.location.hash) || getCurrentMessageId() != null
      if (inThread) {
        const messageId = await resolveMessageId()
        if (messageId) await loadBriefing(tenantId, messageId)
      } else {
        await fetchStats()
      }
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [panelType, resolveMessageId, getCurrentAccount, getCurrentMessageId, fetchStats, loadBriefing, dispatch])
}
