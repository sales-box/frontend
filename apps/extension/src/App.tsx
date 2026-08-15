import { useReducer, useCallback } from 'react'
import { panelReducer, initialPanelState } from './state/panelMachine'
import { getSession, clearSession } from './state/session'
import { useGmailContext } from './hooks/useGmailContext'
import { invalidateDraft } from './lib/draftCache'
import { usePanelActions } from './hooks/usePanelActions'
import { useAuthFlow } from './hooks/useAuthFlow'
import { useSessionRehydrate } from './hooks/useSessionRehydrate'
import { useHashNavigation } from './hooks/useHashNavigation'

import { CollapsedTab } from './screens/CollapsedTab'
import { PanelRouter } from './screens/PanelRouter'
import { ErrorToast } from './components/ErrorToast'

// ── Main component ─────────────────────────────────────────────────────────
interface AppProps {
  /** The host element in Gmail's real DOM that content.tsx created.
   *  App.tsx dispatches custom events on it to trigger syncGmailLayout
   *  without reaching outside the shadow root itself. */
  panelHost?: HTMLElement
  getCurrentMessageId?: () => string | null
  /** Email of the Google account this Gmail tab is logged into (content.tsx).
   *  Used to gate the panel to the connected SE account only. */
  getCurrentAccount?: () => string | null
}

export default function App({ panelHost, getCurrentMessageId = () => null, getCurrentAccount = () => null }: AppProps = {}) {
  const [panel, dispatch] = useReducer(panelReducer, initialPanelState)
  const { resolveAccount, resolveMessageId } = useGmailContext(getCurrentAccount, getCurrentMessageId)
  const {
    fetchStats,
    loadBriefing,
    selectCategory,
    toast: activeToast,
    crmSuggestions,
    resolveCrmActions,
    reportGap,
    consumeGraphThreadId,
  } = usePanelActions({ dispatch, resolveMessageId, getCurrentMessageId })
  const { signIn } = useAuthFlow(dispatch)

  useSessionRehydrate({
    dispatch,
    panelHost,
    resolveAccount,
    getCurrentMessageId,
    fetchStats,
    loadBriefing,
  })

  useHashNavigation({
    panelType: panel.type,
    dispatch,
    resolveMessageId,
    getCurrentAccount,
    getCurrentMessageId,
    fetchStats,
    loadBriefing,
  })

  const handleRefresh = useCallback(async () => {
    await loadBriefing(null, true)
  }, [loadBriefing])

  const handleClose = useCallback(() => {
    panelHost?.dispatchEvent(new CustomEvent('copilot:panel-close'))
    dispatch({ type: 'COLLAPSE' })
  }, [panelHost])

  const handleSwitchAccount = useCallback(async () => {
    await clearSession()
    dispatch({ type: 'RESET' })
  }, [])

  const handleExpand = useCallback(async () => {
    panelHost?.dispatchEvent(new CustomEvent('copilot:panel-open'))
    const { jwt, tenantId, accountEmail } = await getSession()
    if (jwt && tenantId) {
      // Same gate as rehydrate, fail CLOSED: expanding on any account we can't
      // confirm is the connected SE shows "not authorized", never SE data.
      const connected = accountEmail ? String(accountEmail).toLowerCase() : null
      const currentAccount = await resolveAccount()
      if (connected && currentAccount !== connected) {
        dispatch({ type: 'AUTH_FAILED', email: currentAccount ?? undefined })
        return
      }
      const messageId = getCurrentMessageId()
      if (messageId) {
        await loadBriefing(messageId)
      } else {
        await fetchStats()
      }
    } else {
      dispatch({ type: 'EXPAND' })
    }
  }, [loadBriefing, fetchStats, panelHost, getCurrentMessageId, resolveAccount])

  const handleSelectEmail = useCallback(async (threadId: string) => {
    // Already on this thread → the hash won't change → no hashchange fires and
    // the panel would silently stay on the category list. Load directly.
    if (window.location.hash.includes(threadId)) {
      const messageId = await resolveMessageId()
      if (messageId) await loadBriefing(messageId)
      return
    }
    panelHost?.dispatchEvent(new CustomEvent('copilot:navigate-thread', { detail: { threadId } }))
  }, [panelHost, resolveMessageId, loadBriefing])

  const handleEditInGmail = useCallback((reply: string) => {
    // The draft is about to be inserted (and likely sent) — the cached briefing
    // for this message becomes stale the moment the SE replies. Invalidate now
    // so the next open re-asks the backend (which then reports alreadyReplied).
    const messageId = getCurrentMessageId()
    if (messageId) void invalidateDraft(messageId)
    // The graph thread id is consumed (read-once) so it rides this insert only.
    panelHost?.dispatchEvent(new CustomEvent('copilot:edit-in-gmail', {
      detail: { reply, graphThreadId: consumeGraphThreadId() },
    }))
  }, [panelHost, getCurrentMessageId, consumeGraphThreadId])

  // ── Render ───────────────────────────────────────────────────────────────
  if (panel.type === 'collapsed') {
    return <CollapsedTab onExpand={handleExpand} />
  }

  // The panel body — left border is 2px with an accent tint so it reads as
  // a clear separator from the Gmail mail list.
  const panelClasses = `
    relative
    w-[var(--panel-open-width)] h-full flex flex-col
    bg-[var(--color-surface)]
    border-l-2 border-[var(--color-border-focus)]
    text-[var(--color-text-primary)]
    overflow-hidden
    animate-panel-in
  `

  // Render the collapsed tab strip + the open panel side-by-side.
  // The tab strip stays visible so the user can click it to collapse the
  // panel again — same affordance as expanding it.
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        alignItems: 'stretch',
        boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Collapse toggle — same tab the user clicked to open */}
      <CollapsedTab onExpand={handleClose} collapseMode />

      {/* Panel body */}
      <div id="inbox-copilot-panel" className={panelClasses} style={{ fontFamily: 'var(--font-body)' }}>
        <ErrorToast toast={activeToast} />
        <PanelRouter
          panel={panel}
          crmSuggestions={crmSuggestions}
          handlers={{
            onClose: handleClose,
            onSignIn: signIn,
            onSwitchAccount: handleSwitchAccount,
            onRefresh: handleRefresh,
            onSelectCategory: selectCategory,
            onSelectEmail: handleSelectEmail,
            onEditInGmail: handleEditInGmail,
            onBackToOverview: (parent) => dispatch({ type: 'SHOW_OVERVIEW', data: parent }),
            onReportGap: reportGap,
            onResolveCrmActions: resolveCrmActions,
          }}
        />
      </div>
    </div>
  )
}
