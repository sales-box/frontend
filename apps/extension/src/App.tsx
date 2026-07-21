import { useEffect, useReducer, useCallback, useState } from 'react'
import type { BriefingData } from './screens/BriefingSheet'
import type { LowConfidenceData } from './screens/LowConfidenceScreen'
import { InboxOverviewScreen, type InboxOverviewData } from './screens/InboxOverviewScreen'
import { EmailCategoryList, type EmailRowData } from './screens/EmailCategoryList'

import { CollapsedTab }       from './screens/CollapsedTab'
import { AuthScreen }         from './screens/AuthScreen'
import { InvalidScreen }      from './screens/InvalidScreen'
import { LoadingScreen }      from './screens/LoadingScreen'
import { BriefingSheet }      from './screens/BriefingSheet'
import { LowConfidenceScreen }from './screens/LowConfidenceScreen'
import { RevokedScreen }      from './screens/RevokedScreen'

// ── State machine ──────────────────────────────────────────────────────────
type PanelState =
  | { type: 'collapsed' }
  | { type: 'auth' }
  | { type: 'invalid'; email?: string; errorMsg?: string }
  | { type: 'loading' }
  | { type: 'overview'; data: InboxOverviewData }
  | { type: 'category-list'; category: string; data: InboxOverviewData }
  | { type: 'briefing'; data: BriefingData }
  | { type: 'low-confidence'; data: LowConfidenceData }
  | { type: 'revoked' }

type PanelAction =
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE' }
  | { type: 'AUTH_FAILED'; email?: string; errorMsg?: string }
  | { type: 'AUTH_SUCCESS' }
  | { type: 'REVOKED' }
  | { type: 'LOAD_BRIEFING' }
  | { type: 'SHOW_OVERVIEW'; data: InboxOverviewData }
  | { type: 'SHOW_CATEGORY_LIST'; category: string; data: InboxOverviewData }
  | { type: 'SHOW_BRIEFING'; data: BriefingData }
  | { type: 'SHOW_LOW_CONFIDENCE'; data: LowConfidenceData }
  | { type: 'RESET' }

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'EXPAND':        return { type: 'auth' }
    case 'COLLAPSE':      return { type: 'collapsed' }
    case 'AUTH_FAILED':   return { type: 'invalid', email: action.email, errorMsg: action.errorMsg }
    case 'AUTH_SUCCESS':  return { type: 'loading' }
    case 'REVOKED':       return { type: 'revoked' }
    case 'LOAD_BRIEFING': return { type: 'loading' }
    case 'SHOW_OVERVIEW': return { type: 'overview', data: action.data }
    case 'SHOW_CATEGORY_LIST': return { type: 'category-list', category: action.category, data: action.data }
    case 'SHOW_BRIEFING': return { type: 'briefing', data: action.data }
    case 'SHOW_LOW_CONFIDENCE': return { type: 'low-confidence', data: action.data }
    case 'RESET':         return { type: 'auth' }
    default:              return state
  }
}

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
  const [panel, dispatch] = useReducer(panelReducer, { type: 'collapsed' })
  const [toastError, setToastError] = useState<{ message: string; retry: () => void } | null>(null)
  const [categoryEmails, setCategoryEmails] = useState<EmailRowData[]>([])
  const [categoryLoading, setCategoryLoading] = useState(false)

  // Poll for the Google account this Gmail tab is logged into. Gmail mounts the
  // account button a beat after the page, so a single synchronous read races and
  // returns null — which is what let the panel leak onto the wrong account.
  // Poll up to ~4.5s; callers fail CLOSED while this stays null.
  const resolveGmailAccount = useCallback(async (): Promise<string | null> => {
    for (let i = 0; i < 15; i++) {
      const acc = getCurrentAccount()
      if (acc) return acc
      await new Promise((r) => setTimeout(r, 300))
    }
    return null
  }, [getCurrentAccount])

  const fetchInboxStats = useCallback(async () => {
    setToastError(null)
    try {
      const statsResult = await chrome.runtime.sendMessage({ type: 'GET_INBOX_STATS' })
      if (statsResult?.error) {
        if (statsResult.status === 401 || statsResult.status === 403) {
          await chrome.storage.local.remove(['jwt', 'tenantId', 'accountEmail', 'cachedInboxStats'])
          dispatch({ type: statsResult.status === 403 ? 'REVOKED' : 'RESET' })
          return
        }
        throw new Error(statsResult.error)
      }

      await chrome.storage.local.set({ cachedInboxStats: statsResult })
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
    setToastError(null)
    dispatch({ type: 'LOAD_BRIEFING' })
    try {
      // Draft cache — the AI pipeline (extract → match → compose) is expensive.
      // Run it once per message and reuse the result on every later open, so
      // reopening the same email doesn't re-invoke the LLM. Refresh forces a re-run.
      const cacheKey = `copilotDraft:${emailId}`
      let raw = force ? null : (await chrome.storage.local.get(cacheKey))[cacheKey]
      if (!raw) {
        raw = await chrome.runtime.sendMessage({ type: 'PROCESS_EMAIL', messageId: emailId })
        if (raw?.error) {
          if (raw.status === 401 || raw.status === 403) {
            await chrome.storage.local.remove(['jwt', 'tenantId', 'accountEmail', 'cachedInboxStats'])
            dispatch({ type: raw.status === 403 ? 'REVOKED' : 'RESET' })
            return
          }
          throw new Error(raw.error)
        }
        await chrome.storage.local.set({ [cacheKey]: raw })
      }

      const suggestion = {
        reply: raw.draft?.draftText ?? '',
        productConfidence: Math.round((raw.confidence.productConfidence ?? 0) * 100),
        clientHistoryConfidence: Math.round((raw.confidence.clientHistoryConfidence ?? 0) * 100),
        hasHallucination: raw.confidence.hallucinationDetected ?? false,
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
      const { jwt, tenantId, accountEmail, cachedInboxStats } = await chrome.storage.local.get(['jwt', 'tenantId', 'accountEmail', 'cachedInboxStats'])
      if (jwt && tenantId) {
        // Gate to the connected SE account. chrome.storage is shared across
        // every Google account in the profile, so without this check the SE's
        // panel + data leak onto other accounts (clients, personal inboxes).
        // Fail CLOSED: surface SE data ONLY once we've positively confirmed this
        // tab is the connected account. currentAccount === null (couldn't read)
        // counts as "not confirmed" → stay collapsed.
        const connected = accountEmail ? String(accountEmail).toLowerCase() : null
        const currentAccount = await resolveGmailAccount()
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
  }, [panelHost, fetchInboxStats, getCurrentMessageId, resolveGmailAccount, loadSuggestion])

  // Listen for hashchange events in Gmail to automatically reload suggestion or return to overview
  useEffect(() => {
    const handleHashChange = async () => {
      if (panel.type === 'collapsed' || panel.type === 'auth' || panel.type === 'invalid' || panel.type === 'revoked') {
        return
      }

      const { tenantId, accountEmail } = await chrome.storage.local.get(['tenantId', 'accountEmail'])
      if (!tenantId) return

      // Guard against an in-tab account switch. The DOM is already loaded here,
      // so a plain read is reliable; block only on a positive mismatch.
      const connected = accountEmail ? String(accountEmail).toLowerCase() : null
      const currentAccount = getCurrentAccount()
      if (connected && currentAccount && currentAccount !== connected) {
        dispatch({ type: 'COLLAPSE' })
        return
      }

      const messageId = getCurrentMessageId()
      if (messageId) {
        await loadSuggestion(tenantId, messageId)
      } else {
        await fetchInboxStats()
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [panel.type, getCurrentMessageId, getCurrentAccount, loadSuggestion, fetchInboxStats])

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
      await chrome.storage.local.set({ jwt: result.token, tenantId, accountEmail })

      const statsResult = await chrome.runtime.sendMessage({ type: 'GET_INBOX_STATS' })
      if (statsResult?.error) {
        console.error('[Copilot] Inbox stats failed:', statsResult.error)
        dispatch({ type: 'AUTH_FAILED', errorMsg: `Inbox Stats: ${statsResult.error}` })
        return
      }

      await chrome.storage.local.set({ cachedInboxStats: statsResult })

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
    const { tenantId } = await chrome.storage.local.get('tenantId')
    if (tenantId) {
      const messageId = getCurrentMessageId()
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
  }, [loadSuggestion, getCurrentMessageId])

  const handleClose = useCallback(() => {
    panelHost?.dispatchEvent(new CustomEvent('copilot:panel-close'))
    dispatch({ type: 'COLLAPSE' })
  }, [panelHost])
  
  const handleSwitchAccount = useCallback(async () => {
    await chrome.storage.local.remove(['jwt', 'tenantId', 'accountEmail', 'cachedInboxStats'])
    dispatch({ type: 'RESET' })
  }, [])

  const handleExpand = useCallback(async () => {
    panelHost?.dispatchEvent(new CustomEvent('copilot:panel-open'))
    const { jwt, tenantId, accountEmail } = await chrome.storage.local.get(['jwt', 'tenantId', 'accountEmail'])
    if (jwt && tenantId) {
      // Same gate as rehydrate, fail CLOSED: expanding on any account we can't
      // confirm is the connected SE shows "not authorized", never SE data.
      const connected = accountEmail ? String(accountEmail).toLowerCase() : null
      const currentAccount = await resolveGmailAccount()
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
  }, [loadSuggestion, fetchInboxStats, panelHost, getCurrentMessageId, resolveGmailAccount])

  const handleSelectCategory = useCallback(async (category: string, data: InboxOverviewData) => {
    dispatch({ type: 'SHOW_CATEGORY_LIST', category, data })
    setToastError(null)
    setCategoryLoading(true)
    setCategoryEmails([])
    try {
      const result = await chrome.runtime.sendMessage({ type: 'GET_CATEGORIZED_EMAILS', category })
      if (result?.error) {
        if (result.status === 401 || result.status === 403) {
          await chrome.storage.local.remove(['jwt', 'tenantId', 'accountEmail', 'cachedInboxStats'])
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

  const handleSelectEmail = useCallback((threadId: string) => {
    panelHost?.dispatchEvent(new CustomEvent('copilot:navigate-thread', { detail: { threadId } }))
  }, [panelHost])

  const handleEditInGmail = useCallback((reply: string) => {
    panelHost?.dispatchEvent(new CustomEvent('copilot:edit-in-gmail', { detail: { reply } }))
  }, [panelHost])

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
