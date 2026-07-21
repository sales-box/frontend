import { useReducer, useCallback, useRef } from 'react'
import { panelReducer, initialPanelState } from './state/panelMachine'
import { getSession, setSession, clearSession } from './state/session'
import { useGmailContext } from './hooks/useGmailContext'
import { sendToBackground, handleAuthErr } from './services/backgroundBridge'
import { InboxOverviewScreen, type InboxOverviewData } from './screens/InboxOverviewScreen'
import { EmailCategoryList, type EmailRowData } from './screens/EmailCategoryList'
import { derivePipelineScreen, type PipelineResponse } from './lib/derivePipelineScreen'
import { getCachedDraft, setCachedDraft, invalidateDraft } from './lib/draftCache'
import { useAsyncAction, type AsyncAction } from './hooks/useAsyncAction'
import { useSessionRehydrate } from './hooks/useSessionRehydrate'
import { useHashNavigation } from './hooks/useHashNavigation'

import { CollapsedTab } from './screens/CollapsedTab'
import { AuthScreen } from './screens/AuthScreen'
import { InvalidScreen } from './screens/InvalidScreen'
import { LoadingScreen } from './screens/LoadingScreen'
import { BriefingSheet } from './screens/BriefingSheet'
import { LowConfidenceScreen } from './screens/LowConfidenceScreen'
import { RevokedScreen } from './screens/RevokedScreen'
import { RepliedScreen } from './screens/RepliedScreen'
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
  // Monotonic token: only the LATEST loadSuggestion may dispatch. Without it,
  // two rapid thread opens race and the slower response wins — rendering the
  // wrong email's briefing (the flicker).
  const loadSeqRef = useRef(0)

  const briefingLoaderRef = useRef<AsyncAction<[string, string | null | undefined, boolean]>>(null!)
  const categoryLoaderRef = useRef<AsyncAction<[string, InboxOverviewData]>>(null!)
  const fetchStatsRef = useRef<AsyncAction<[]>>(null!)

  const fetchInboxStatsInner = useCallback(async () => {
    briefingLoaderRef.current?.clearToast()
    categoryLoaderRef.current?.clearToast()
    const res = await sendToBackground<InboxOverviewData>({ type: 'GET_INBOX_STATS' })
    if (await handleAuthErr(res, dispatch)) return
    if (!res.ok) throw new Error(res.kind === 'error' ? res.message : res.kind)
    await setSession({ cachedInboxStats: res.data })
    dispatch({
      type: 'SHOW_OVERVIEW',
      data: res.data,
    })
  }, [])

  const loadSuggestionInner = useCallback(async (_tenantId: string, emailId?: string | null, force = false) => {
    fetchStatsRef.current?.clearToast()
    categoryLoaderRef.current?.clearToast()
    let resolvedId = emailId
    if (!resolvedId) {
      resolvedId = await resolveMessageId()
    }
    if (!resolvedId) {
      throw new Error('No open Gmail thread detected')
    }
    const seq = ++loadSeqRef.current
    dispatch({ type: 'LOAD_BRIEFING' })
    let raw: PipelineResponse | null = force ? null : await getCachedDraft(resolvedId)
    if (!raw) {
      const res = await sendToBackground<PipelineResponse>({ type: 'PROCESS_EMAIL', messageId: resolvedId })
      if (await handleAuthErr(res, dispatch)) return
      if (!res.ok) throw new Error(res.kind === 'error' ? res.message : res.kind)
      raw = res.data
      await setCachedDraft(resolvedId, raw)
    }

    if (seq !== loadSeqRef.current) return

    const derived = derivePipelineScreen(raw)
    if (derived.kind === 'replied')          dispatch({ type: 'SHOW_REPLIED', summary: derived.summary })
    else if (derived.kind === 'briefing')    dispatch({ type: 'SHOW_BRIEFING', data: derived.data })
    else                                     dispatch({ type: 'SHOW_LOW_CONFIDENCE', data: derived.data })
  }, [resolveMessageId])

  const selectCategoryInner = useCallback(async (category: string, data: InboxOverviewData) => {
    fetchStatsRef.current?.clearToast()
    briefingLoaderRef.current?.clearToast()
    dispatch({ type: 'SHOW_CATEGORY_LIST', category, data })
    const res = await sendToBackground<{ emails: EmailRowData[] }>({ type: 'GET_CATEGORIZED_EMAILS', category })
    if (await handleAuthErr(res, dispatch)) return
    if (!res.ok) {
      dispatch({ type: 'CATEGORY_FAILED', message: res.kind === 'error' ? res.message : res.kind })
      throw new Error("Couldn't load these emails.")
    }
    dispatch({ type: 'CATEGORY_LOADED', emails: res.data.emails || [] })
  }, [])

  const formatStatsError = useCallback((err: unknown) => {
    const m = err instanceof Error ? err.message : String(err)
    return `Failed to load inbox stats: ${m}`
  }, [])

  const formatBriefingError = useCallback((err: unknown) => {
    const m = err instanceof Error ? err.message : String(err)
    if (m === 'No open Gmail thread detected') {
      return m
    }
    return `Failed to load suggestion: ${m}`
  }, [])

  const formatCategoryError = useCallback(() => {
    return "Couldn't load these emails."
  }, [])

  const fetchStats = useAsyncAction(fetchInboxStatsInner, formatStatsError)
  fetchStatsRef.current = fetchStats

  const briefingLoader = useAsyncAction(loadSuggestionInner, formatBriefingError)
  briefingLoaderRef.current = briefingLoader

  const categoryLoader = useAsyncAction(selectCategoryInner, formatCategoryError)
  categoryLoaderRef.current = categoryLoader

  const fetchInboxStats = fetchStats.run
  const loadSuggestion = briefingLoader.run
  const handleSelectCategory = categoryLoader.run

  useSessionRehydrate({
    dispatch,
    panelHost,
    resolveAccount,
    getCurrentMessageId,
    fetchStats: fetchStats.run,
    loadBriefing: briefingLoader.run,
  })

  useHashNavigation({
    panelType: panel.type,
    dispatch,
    resolveMessageId,
    getCurrentAccount,
    getCurrentMessageId,
    fetchStats: fetchStats.run,
    loadBriefing: briefingLoader.run,
  })

  // ── Auth flow ────────────────────────────────────────────────────────────
  const handleSignIn = useCallback(async () => {
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

      dispatch({
        type: 'SHOW_OVERVIEW',
        data: statsRes.data,
      })
    } catch (err) {
      console.error('[Copilot] Login flow failed:', err)
      dispatch({ type: 'AUTH_FAILED', errorMsg: err instanceof Error ? err.message : String(err) })
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    const { tenantId } = await getSession()
    if (tenantId) {
      await briefingLoaderRef.current.run(tenantId, null, true)
    }
  }, [])

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
        await loadSuggestion(tenantId, messageId)
      } else {
        await fetchInboxStats()
      }
    } else {
      dispatch({ type: 'EXPAND' })
    }
  }, [loadSuggestion, fetchInboxStats, panelHost, getCurrentMessageId, resolveAccount])



  const handleSelectEmail = useCallback(async (threadId: string) => {
    // Already on this thread → the hash won't change → no hashchange fires and
    // the panel would silently stay on the category list. Load directly.
    if (window.location.hash.includes(threadId)) {
      const { tenantId } = await getSession()
      const messageId = await resolveMessageId()
      if (tenantId && messageId) await loadSuggestion(tenantId, messageId)
      return
    }
    panelHost?.dispatchEvent(new CustomEvent('copilot:navigate-thread', { detail: { threadId } }))
  }, [panelHost, resolveMessageId, loadSuggestion])

  const handleEditInGmail = useCallback((reply: string) => {
    // The draft is about to be inserted (and likely sent) — the cached briefing
    // for this message becomes stale the moment the SE replies. Invalidate now
    // so the next open re-asks the backend (which then reports alreadyReplied).
    const messageId = getCurrentMessageId()
    if (messageId) void invalidateDraft(messageId)
    panelHost?.dispatchEvent(new CustomEvent('copilot:edit-in-gmail', { detail: { reply } }))
  }, [panelHost, getCurrentMessageId])

  const activeToast = fetchStats.toast ?? briefingLoader.toast ?? categoryLoader.toast

  // ── Render ───────────────────────────────────────────────────────────────
  if (panel.type === 'collapsed') {
    return <CollapsedTab onExpand={handleExpand} />
  }

  // The panel body — left border is 2px with an accent tint so it reads as
  // a clear separator from the Gmail mail list.
  const panelClasses = `
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
        {(() => {
          switch (panel.type) {
            case 'auth':
              return <AuthScreen onClose={handleClose} onSignIn={handleSignIn} />

            case 'invalid':
              return (
                <InvalidScreen
                  email={panel.email}
                  errorMsg={panel.errorMsg}
                  onClose={handleClose}
                  onSwitchAccount={handleSwitchAccount}
                />
              )

            case 'loading':
              return <LoadingScreen />

            case 'overview':
              return (
                <InboxOverviewScreen
                  data={panel.data}
                  onClose={handleClose}
                  onSelectCategory={(category) => handleSelectCategory(category, panel.data)}
                />
              )

            case 'category-list':
              return (
                <EmailCategoryList
                  category={panel.category}
                  emails={panel.emails}
                  loading={panel.loading}
                  onClose={handleClose}
                  onBack={() => dispatch({ type: 'SHOW_OVERVIEW', data: panel.parent })}
                  onSelectEmail={handleSelectEmail}
                />
              )

            case 'briefing':
              return (
                <BriefingSheet
                  data={panel.data}
                  onClose={handleClose}
                  onRefresh={handleRefresh}
                  onSend={handleEditInGmail}
                  onEditInGmail={handleEditInGmail}
                />
              )

            case 'low-confidence':
              return (
                <LowConfidenceScreen
                  data={panel.data}
                  onClose={handleClose}
                  onRefresh={handleRefresh}
                  onComposeManually={() => handleEditInGmail('')}
                  onInsertDraft={(reply) => handleEditInGmail(reply)}
                  onUploadDoc={() => {
                    chrome.tabs.create({ url: 'https://dashboard.inboxcopilot.ai/knowledge' })
                  }}
                />
              )

            case 'replied':
              return <RepliedScreen summary={panel.summary ?? null} onClose={handleClose} />

            case 'revoked':
              return <RevokedScreen onClose={handleClose} />

            default:
              return null
          }
        })()}
      </div>
    </div>
  )
}
