import { useEffect, useReducer, useCallback, useState, useRef } from 'react'
import { panelReducer, initialPanelState } from './state/panelMachine'
import { getSession, setSession, clearSession } from './state/session'
import { useGmailContext } from './hooks/useGmailContext'
import { InboxOverviewScreen, type InboxOverviewData } from './screens/InboxOverviewScreen'
import { EmailCategoryList, type EmailRowData } from './screens/EmailCategoryList'

import { CollapsedTab }       from './screens/CollapsedTab'
import { AuthScreen }         from './screens/AuthScreen'
import { InvalidScreen }      from './screens/InvalidScreen'
import { LoadingScreen }      from './screens/LoadingScreen'
import { BriefingSheet }      from './screens/BriefingSheet'
import { LowConfidenceScreen }from './screens/LowConfidenceScreen'
import { RevokedScreen }      from './screens/RevokedScreen'
import { PanelHeader }        from './components/PanelHeader'

// ── Confidence threshold for low-confidence state ──────────────────────────
const CONFIDENCE_THRESHOLD = 60

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
  const [toastError, setToastError] = useState<{ message: string; retry: () => void } | null>(null)
  const [categoryEmails, setCategoryEmails] = useState<EmailRowData[]>([])
  const [categoryLoading, setCategoryLoading] = useState(false)
  // Monotonic token: only the LATEST loadSuggestion may dispatch. Without it,
  // two rapid thread opens race and the slower response wins — rendering the
  // wrong email's briefing (the flicker).
  const loadSeqRef = useRef(0)

  const fetchInboxStats = useCallback(async () => {
    setToastError(null)
    try {
      const statsResult = await chrome.runtime.sendMessage({ type: 'GET_INBOX_STATS' })
      if (!statsResult || statsResult.error) {
        if (statsResult?.status === 401 || statsResult?.status === 403) {
          await clearSession()
          dispatch({ type: statsResult.status === 403 ? 'REVOKED' : 'RESET' })
          return
        }
        // undefined = background gave no response (unknown message type / worker
        // asleep). Dispatching SHOW_OVERVIEW with it would crash the overview.
        throw new Error(statsResult?.error ?? 'No response from the extension background')
      }

      await setSession({ cachedInboxStats: statsResult })
      dispatch({
        type: 'SHOW_OVERVIEW',
        data: statsResult,
      })
    } catch (err) {
      console.error('[Copilot] Fetch stats failed:', err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      setToastError({
        message: `Failed to load inbox stats: ${errorMsg}`,
        retry: () => fetchInboxStats(),
      })
    }
  }, [])

  const loadSuggestion = useCallback(async (tenantId: string, emailId: string, force = false) => {
    const seq = ++loadSeqRef.current
    setToastError(null)
    dispatch({ type: 'LOAD_BRIEFING' })
    try {
      // Draft cache — the AI pipeline (extract → match → compose) is expensive.
      // Run it once per message and reuse the result on every later open, so
      // reopening the same email doesn't re-invoke the LLM. Refresh forces a re-run.
      const cacheKey = `copilotDraft:${emailId}`
      let raw = force ? null : (await chrome.storage.local.get(cacheKey))[cacheKey]
      // Never serve a cached replied-state: its summary is a live DB read that
      // changes as background processing lands. Treat it as a cache miss.
      if (raw?.alreadyReplied) raw = null
      if (!raw) {
        raw = await chrome.runtime.sendMessage({ type: 'PROCESS_EMAIL', messageId: emailId })
        if (raw?.error) {
          if (raw.status === 401 || raw.status === 403) {
            await clearSession()
            dispatch({ type: raw.status === 403 ? 'REVOKED' : 'RESET' })
            return
          }
          throw new Error(raw.error)
        }
        // Cache only real draft results (replied-state must stay live).
        if (!raw?.alreadyReplied) {
          await chrome.storage.local.set({ [cacheKey]: raw })
        }
      }

      // A newer load started while we awaited — this result is for a thread
      // the user already navigated away from. Drop it.
      if (seq !== loadSeqRef.current) return

      // Thread already handled (we opened our own sent reply) — nothing to
      // draft or regenerate. Show the done state + a read-only summary of what
      // the AI computed for this thread.
      if (raw?.alreadyReplied) {
        dispatch({ type: 'SHOW_REPLIED', summary: raw.summary ?? null })
        return
      }

      const conf = raw.confidence ?? {}
      const suggestion = {
        reply: raw.draft?.draftText ?? '',
        productConfidence: Math.round((conf.productConfidence ?? 0) * 100),
        clientHistoryConfidence: Math.round((conf.clientHistoryConfidence ?? 0) * 100),
        hasHallucination: conf.hallucinationDetected ?? false,
        clientName: raw.client?.name ?? 'Unknown',
        company: raw.client?.company ?? 'Unknown company',
        role: '', // no job-title in the CRM; client status is surfaced via dealStatus, not here
        dealStatus: (raw.client?.status === 'active' ? 'active' : 'prospect') as 'active' | 'prospect',
        emailTimestamp: raw.emailTimestamp ?? new Date().toISOString(),
      }

      const isLowConfidence =
        suggestion.productConfidence < CONFIDENCE_THRESHOLD ||
        suggestion.clientHistoryConfidence < CONFIDENCE_THRESHOLD ||
        suggestion.hasHallucination

      if (isLowConfidence) {
        dispatch({
          type: 'SHOW_LOW_CONFIDENCE',
          data: {
            clientName:              suggestion.clientName,
            company:                 suggestion.company,
            role:                    suggestion.role,
            emailTimestamp:          suggestion.emailTimestamp,
            productConfidence:       suggestion.productConfidence,
            clientHistoryConfidence: suggestion.clientHistoryConfidence,
            missingContext: {
              hasProductDocs:     suggestion.productConfidence >= CONFIDENCE_THRESHOLD,
              hasPreviousEmails:  suggestion.clientHistoryConfidence >= CONFIDENCE_THRESHOLD,
              hasAccountHistory:  suggestion.clientHistoryConfidence >= 50,
            },
            suggestedReply:          suggestion.reply,
          },
        })
      } else {
        dispatch({
          type: 'SHOW_BRIEFING',
          data: {
            clientName:              suggestion.clientName,
            company:                 suggestion.company,
            role:                    suggestion.role,
            dealStatus:              suggestion.dealStatus,
            emailTimestamp:          suggestion.emailTimestamp,
            productConfidence:       suggestion.productConfidence,
            clientHistoryConfidence: suggestion.clientHistoryConfidence,
            suggestedReply:          suggestion.reply,
          },
        })
      }
    } catch (err) {
      console.error('[Copilot] Failed to load suggestion:', err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      setToastError({
        message: `Failed to load suggestion: ${errorMsg}`,
        retry: () => loadSuggestion(tenantId, emailId),
      })
    }
  }, [])

  // Task 2: Session Rehydration on Mount
  useEffect(() => {
    const rehydrateSession = async () => {
      const { jwt, tenantId, accountEmail, cachedInboxStats } = await getSession()
      if (jwt && tenantId) {
        // Gate to the connected SE account. chrome.storage is shared across
        // every Google account in the profile, so without this check the SE's
        // panel + data leak onto other accounts (clients, personal inboxes).
        // Fail CLOSED: surface SE data ONLY once we've positively confirmed this
        // tab is the connected account. currentAccount === null (couldn't read)
        // counts as "not confirmed" → stay collapsed.
        const connected = accountEmail ? String(accountEmail).toLowerCase() : null
        const currentAccount = await resolveAccount()
        if (connected && currentAccount !== connected) {
          dispatch({ type: 'COLLAPSE' })
          return
        }

        panelHost?.dispatchEvent(new CustomEvent('copilot:panel-open'))

        const messageId = getCurrentMessageId()
        if (messageId) {
          await loadSuggestion(tenantId, messageId)
        } else {
          const placeholderStats: InboxOverviewData = cachedInboxStats || {
            totalEmails: 0,
            syncedAt: new Date().toISOString(),
            urgentCount: 0,
            intentBreakdown: [
              { label: 'Product inquiry', count: 0, key: 'product-inquiry' },
              { label: 'Demo request', count: 0, key: 'demo-request' },
              { label: 'Support', count: 0, key: 'support' },
              { label: 'Follow-up', count: 0, key: 'follow-up' },
              { label: 'Sensitive', count: 0, key: 'sensitive' }
            ],
            reviewedBreakdown: { ready: 0, needsReview: 0, manual: 0 },
            notYetReviewedCount: 0
          }
          
          dispatch({ type: 'SHOW_OVERVIEW', data: placeholderStats })
          fetchInboxStats()
        }
      } else {
        dispatch({ type: 'COLLAPSE' })
      }
    }
    rehydrateSession()
  }, [panelHost, fetchInboxStats, getCurrentMessageId, resolveAccount, loadSuggestion])

  // Listen for hashchange events in Gmail to automatically reload suggestion or return to overview
  useEffect(() => {
    const handleHashChange = async () => {
      if (panel.type === 'collapsed' || panel.type === 'auth' || panel.type === 'invalid' || panel.type === 'revoked') {
        return
      }

      const { tenantId, accountEmail } = await getSession()
      if (!tenantId) return

      // Guard against an in-tab account switch — fail CLOSED for new data:
      // a mismatch collapses; an unreadable account (null) skips loading
      // rather than proceeding with the previous account's session.
      const connected = accountEmail ? String(accountEmail).toLowerCase() : null
      const currentAccount = getCurrentAccount()
      if (connected) {
        if (currentAccount === null) return
        if (currentAccount !== connected) {
          dispatch({ type: 'COLLAPSE' })
          return
        }
      }

      // A thread URL ends in a long id — as the LAST segment, whatever the
      // view: #inbox/<id>, #search/<query>/<id>, #label/<name>/<id>. (The old
      // "second segment" check misread search/label URLs and yanked the open
      // briefing back to the overview.) The DOM probe covers exotic shapes.
      const inThread =
        /\/[A-Za-z0-9_-]{16,}$/.test(window.location.hash) ||
        getCurrentMessageId() != null
      if (inThread) {
        const messageId = await resolveMessageId()
        if (messageId) await loadSuggestion(tenantId, messageId)
      } else {
        await fetchInboxStats()
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [panel.type, resolveMessageId, getCurrentMessageId, getCurrentAccount, loadSuggestion, fetchInboxStats])

  // ── Auth flow ────────────────────────────────────────────────────────────
  const handleSignIn = useCallback(async () => {
    try {
      const codeResult = await chrome.runtime.sendMessage({ type: 'GET_SE_AUTH_CODE' }) as
        | { code: string; redirectUri: string }
        | { error: string }

      if ('error' in codeResult) {
        console.error('[Copilot] Failed to get auth code:', codeResult.error)
        dispatch({ type: 'AUTH_FAILED', errorMsg: `OAuth Error: ${codeResult.error}` })
        return
      }

      const result = await chrome.runtime.sendMessage({
        type: 'SE_LOGIN',
        code: codeResult.code,
        redirectUri: codeResult.redirectUri,
      })

      if (result?.error) {
        console.error('[Copilot] Backend login failed:', result.error)
        dispatch({ type: 'AUTH_FAILED', errorMsg: `Backend Login: ${result.error}` })
        return
      }

      dispatch({ type: 'AUTH_SUCCESS' })

      const authMe = await chrome.runtime.sendMessage({
        type: 'GET_AUTH_ME',
        jwt: result.token,
      })

      if (authMe?.error) {
        console.error('[Copilot] getAuthMe failed:', authMe.error)
        dispatch({ type: 'AUTH_FAILED', errorMsg: `Auth Me: ${authMe.error}` })
        return
      }

      const tenantId = authMe.tenantId
      const accountEmail = authMe.email
      await setSession({ jwt: result.token, tenantId, accountEmail })

      const statsResult = await chrome.runtime.sendMessage({ type: 'GET_INBOX_STATS' })
      if (statsResult?.error) {
        console.error('[Copilot] Inbox stats failed:', statsResult.error)
        dispatch({ type: 'AUTH_FAILED', errorMsg: `Inbox Stats: ${statsResult.error}` })
        return
      }

      await setSession({ cachedInboxStats: statsResult })

      dispatch({
        type: 'SHOW_OVERVIEW',
        data: statsResult,
      })
    } catch (err) {
      console.error('[Copilot] Login flow failed:', err)
      dispatch({ type: 'AUTH_FAILED', errorMsg: err instanceof Error ? err.message : String(err) })
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    const { tenantId } = await getSession()
    if (tenantId) {
      // Poll — a single sync read races Gmail's thread render.
      const messageId = await resolveMessageId()
      if (!messageId) {
        setToastError({
          message: 'No open Gmail thread detected',
          retry: () => handleRefresh(),
        })
        return
      }
      // Refresh button = explicit user intent to regenerate → bypass the cache.
      await loadSuggestion(tenantId, messageId, true)
    }
  }, [loadSuggestion, resolveMessageId])

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

  const handleSelectCategory = useCallback(async (category: string, data: InboxOverviewData) => {
    dispatch({ type: 'SHOW_CATEGORY_LIST', category, data })
    setToastError(null)
    setCategoryLoading(true)
    setCategoryEmails([])
    try {
      const result = await chrome.runtime.sendMessage({ type: 'GET_CATEGORIZED_EMAILS', category })
      if (result?.error) {
        if (result.status === 401 || result.status === 403) {
          await clearSession()
          dispatch({ type: result.status === 403 ? 'REVOKED' : 'RESET' })
          return
        }
        // A real failure — surface it instead of rendering an empty list, which
        // reads as "no emails" and hides the error.
        console.error('[Copilot] GET_CATEGORIZED_EMAILS failed:', result.error)
        setToastError({ message: "Couldn't load these emails.", retry: () => handleSelectCategory(category, data) })
        setCategoryEmails([])
      } else {
        setCategoryEmails(result.emails || [])
      }
    } catch (err) {
      console.error('[Copilot] GET_CATEGORIZED_EMAILS threw:', err)
      setToastError({ message: "Couldn't load these emails.", retry: () => handleSelectCategory(category, data) })
      setCategoryEmails([])
    } finally {
      setCategoryLoading(false)
    }
  }, [])

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
    if (messageId) void chrome.storage.local.remove(`copilotDraft:${messageId}`)
    panelHost?.dispatchEvent(new CustomEvent('copilot:edit-in-gmail', { detail: { reply } }))
  }, [panelHost, getCurrentMessageId])

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
        {toastError && (
          <div className="bg-[var(--color-danger-light)] text-[var(--color-danger)] p-3 border-b border-[var(--color-danger)] flex justify-between items-center text-sm flex-shrink-0">
            <span className="font-semibold">{toastError.message}</span>
            <button 
              onClick={toastError.retry}
              className="ml-2 px-3 py-1 bg-[var(--color-danger)] text-white rounded hover:opacity-90 transition-opacity text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
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
                  emails={categoryEmails}
                  loading={categoryLoading}
                  onClose={handleClose}
                  onBack={() => dispatch({ type: 'SHOW_OVERVIEW', data: panel.data })}
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

            case 'replied': {
              const s = panel.summary
              const pct = (v: number | null | undefined) =>
                v == null ? '—' : `${Math.round(v * 100)}%`
              return (
                <div className="flex flex-col h-full bg-[var(--color-surface)] overflow-y-auto">
                  <PanelHeader onClose={handleClose} />
                  <div className="flex flex-col items-center px-6 py-8 text-center">
                    <div
                      className="w-14 h-14 mb-5 rounded-full flex items-center justify-center text-2xl"
                      style={{ background: 'color-mix(in srgb, var(--color-success) 14%, transparent)', color: 'var(--color-success)' }}
                      aria-hidden="true"
                    >
                      ✓
                    </div>
                    <p className="text-eyebrow mb-2">DONE</p>
                    <h1
                      className="text-heading text-[var(--color-text-primary)] mb-3"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Already <em className="text-primary not-italic">replied.</em>
                    </h1>
                    <p className="text-small text-[var(--color-text-secondary)] leading-relaxed max-w-[230px] mb-6">
                      Your reply is in the thread — nothing left to draft.
                    </p>
                    {s && (
                      <div className="w-full text-left">
                        <p className="text-eyebrow mb-3">WHAT THE AI SAW</p>
                        <div className="flex gap-3 mb-3">
                          <div className="flex-1 rounded-[var(--radius-md)] px-3 py-2 bg-[var(--color-surface-tertiary)]">
                            <div className="text-caption text-[var(--color-text-tertiary)]">Product</div>
                            <div className="text-body font-semibold text-[var(--color-text-primary)]">{pct(s.productConfidence)}</div>
                          </div>
                          <div className="flex-1 rounded-[var(--radius-md)] px-3 py-2 bg-[var(--color-surface-tertiary)]">
                            <div className="text-caption text-[var(--color-text-tertiary)]">History</div>
                            <div className="text-body font-semibold text-[var(--color-text-primary)]">{pct(s.clientHistoryConfidence)}</div>
                          </div>
                        </div>
                        <div className="rounded-[var(--radius-md)] px-3 py-2 bg-[var(--color-surface-tertiary)]">
                          <div className="text-caption text-[var(--color-text-tertiary)]">Intent</div>
                          <div className="text-body text-[var(--color-text-primary)] capitalize">{s.intent}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            }

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
