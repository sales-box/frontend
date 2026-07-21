import { useEffect } from 'react'
import type React from 'react'
import type { PanelAction } from '../state/panelMachine'
import type { InboxOverviewData } from '../screens/InboxOverviewScreen'
import { getSession } from '../state/session'

interface Options {
  dispatch: React.Dispatch<PanelAction>
  panelHost?: HTMLElement
  resolveAccount: () => Promise<string | null>
  getCurrentMessageId: () => string | null
  fetchStats: () => Promise<void>
  loadBriefing: (tenantId: string, messageId: string) => Promise<void>
}

const PLACEHOLDER_STATS: InboxOverviewData = {
  totalEmails: 0,
  syncedAt: new Date(0).toISOString(),
  urgentCount: 0,
  intentBreakdown: [
    { label: 'Product inquiry', count: 0, key: 'product-inquiry' },
    { label: 'Demo request',    count: 0, key: 'demo-request' },
    { label: 'Support',         count: 0, key: 'support' },
    { label: 'Follow-up',       count: 0, key: 'follow-up' },
    { label: 'Sensitive',       count: 0, key: 'sensitive' },
  ],
  reviewedBreakdown: { ready: 0, needsReview: 0, manual: 0 },
  notYetReviewedCount: 0,
}

export function useSessionRehydrate({
  dispatch, panelHost, resolveAccount, getCurrentMessageId, fetchStats, loadBriefing,
}: Options) {
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { jwt, tenantId, accountEmail, cachedInboxStats } = await getSession()
      if (cancelled) return
      if (!jwt || !tenantId) { dispatch({ type: 'COLLAPSE' }); return }

      // Fail CLOSED: surface SE data ONLY once we've positively confirmed this tab is the connected account.
      const connected = accountEmail ? String(accountEmail).toLowerCase() : null
      const current = await resolveAccount()
      if (cancelled) return
      if (connected && current !== connected) { dispatch({ type: 'COLLAPSE' }); return }

      panelHost?.dispatchEvent(new CustomEvent('copilot:panel-open'))

      const messageId = getCurrentMessageId()
      if (messageId) {
        await loadBriefing(tenantId, messageId)
      } else {
        const stats = cachedInboxStats ?? { ...PLACEHOLDER_STATS, syncedAt: new Date().toISOString() }
        dispatch({ type: 'SHOW_OVERVIEW', data: stats })
        void fetchStats()
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
