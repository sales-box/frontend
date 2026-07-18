import { useEffect, useReducer, useCallback } from 'react'
import type { BriefingData } from './screens/BriefingSheet'
import type { LowConfidenceData } from './screens/LowConfidenceScreen'
import { InboxOverviewScreen, type InboxOverviewData } from './screens/InboxOverviewScreen'
import { EmailCategoryList } from './screens/EmailCategoryList'

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
  getCurrentThreadId?: () => string | null
}

export default function App({ panelHost, getCurrentThreadId = () => null }: AppProps = {}) {
  const [panel, dispatch] = useReducer(panelReducer, { type: 'collapsed' })

  const loadSuggestion = useCallback(async (_tenantId: string, emailId: string) => {
    try {
      const raw = await chrome.runtime.sendMessage({ type: 'PROCESS_EMAIL', messageId: emailId })
      if (raw?.error) throw new Error(raw.error)

      const suggestion = {
        reply: raw.draft?.draftText ?? '',
        productConfidence: Math.round((raw.confidence.productConfidence ?? 0) * 100),
        clientHistoryConfidence: Math.round((raw.confidence.clientHistoryConfidence ?? 0) * 100),
        hasHallucination: raw.confidence.hallucinationDetected ?? false,
        clientName: raw.client?.name ?? 'Unknown',
        company: raw.client?.company ?? 'Unknown company',
        // Backend has no dedicated "role" field yet — using status as a stand-in.
        // Flag this to the team, don't invent a fake role string.
        role: raw.client?.status ?? '',
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
      dispatch({ type: 'RESET' })
    }
  }, [])

  // Listen for hashchange events in Gmail to automatically reload suggestion or return to overview
  useEffect(() => {
    const handleHashChange = async () => {
      if (panel.type === 'collapsed' || panel.type === 'auth' || panel.type === 'invalid' || panel.type === 'revoked') {
        return
      }

      const { tenantId } = await chrome.storage.local.get('tenantId')
      if (!tenantId) return

      const threadId = getCurrentThreadId()
      if (threadId) {
        dispatch({ type: 'LOAD_BRIEFING' })
        await loadSuggestion(tenantId, threadId)
      } else {
        // If user navigates back to inbox (no open thread), show overview
        const statsResult = await chrome.runtime.sendMessage({ type: 'GET_INBOX_STATS' })
        if (!statsResult?.error) {
          dispatch({
            type: 'SHOW_OVERVIEW',
            data: {
              totalEmails: statsResult.totalEmails,
              syncedAt: statsResult.syncedAt,
            },
          })
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [panel.type, getCurrentThreadId, loadSuggestion])

  // ── Auth flow ────────────────────────────────────────────────────────────
  const handleSignIn = useCallback(async () => {
    try {
      // Step 1: Get a Google OAuth *authorization code* from the background worker.
      const codeResult = await chrome.runtime.sendMessage({ type: 'GET_SE_AUTH_CODE' }) as
        | { code: string; redirectUri: string }
        | { error: string }

      if ('error' in codeResult) {
        console.error('[Copilot] Failed to get auth code:', codeResult.error)
        dispatch({ type: 'AUTH_FAILED', errorMsg: `OAuth Error: ${codeResult.error}` })
        return
      }

      // Step 2: Exchange the code for an SE JWT via the real backend endpoint.
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

      // Store JWT for persistence. The tenantId lives in the JWT payload.
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

      // Real inbox stats — independent of the auth above.
      const statsResult = await chrome.runtime.sendMessage({ type: 'GET_INBOX_STATS' })
      if (statsResult?.error) {
        console.error('[Copilot] Inbox stats failed:', statsResult.error)
        dispatch({ type: 'AUTH_FAILED', errorMsg: `Inbox Stats: ${statsResult.error}` })
        return
      }

      dispatch({
        type: 'SHOW_OVERVIEW',
        data: {
          totalEmails: statsResult.totalEmails,
          syncedAt: statsResult.syncedAt,
          // TODO(AI-pipeline): replace N/A once GET /emails/categorized exists
        },
      })
    } catch (err) {
      console.error('[Copilot] Login flow failed:', err)
      dispatch({ type: 'AUTH_FAILED', errorMsg: err instanceof Error ? err.message : String(err) })
    }
  }, [loadSuggestion])

  const handleRefresh = useCallback(async () => {
    const { tenantId } = await chrome.storage.local.get('tenantId')
    if (tenantId) {
      const threadId = getCurrentThreadId()
      if (!threadId) {
        console.warn('[Copilot] No open Gmail thread detected')
        dispatch({ type: 'RESET' })
        return
      }
      dispatch({ type: 'LOAD_BRIEFING' })
      await loadSuggestion(tenantId, threadId)
    }
  }, [loadSuggestion, getCurrentThreadId])

  const handleClose = useCallback(() => {
    panelHost?.dispatchEvent(new CustomEvent('copilot:panel-close'))
    dispatch({ type: 'COLLAPSE' })
  }, [panelHost])
  
  const handleSwitchAccount = useCallback(async () => {
    await chrome.storage.local.remove(['jwt', 'tenantId'])
    dispatch({ type: 'RESET' })
  }, [])

  const handleExpand = useCallback(async () => {
    // Notify content.tsx to push Gmail layout before the panel renders
    panelHost?.dispatchEvent(new CustomEvent('copilot:panel-open'))
    dispatch({ type: 'EXPAND' })
    const { jwt, tenantId } = await chrome.storage.local.get(['jwt', 'tenantId'])
    if (jwt && tenantId) {
      const statsResult = await chrome.runtime.sendMessage({ type: 'GET_INBOX_STATS' })
      if (!statsResult?.error) {
        dispatch({
          type: 'SHOW_OVERVIEW',
          data: {
            totalEmails: statsResult.totalEmails,
            syncedAt: statsResult.syncedAt,
          },
        })
      } else {
        const threadId = getCurrentThreadId()
        if (!threadId) {
          console.warn('[Copilot] No open Gmail thread detected')
          dispatch({ type: 'RESET' })
          return
        }
        dispatch({ type: 'LOAD_BRIEFING' })
        await loadSuggestion(tenantId, threadId)
      }
    }
  }, [loadSuggestion, panelHost, getCurrentThreadId])

  const handleSelectCategory = useCallback((category: string, data: InboxOverviewData) => {
    dispatch({ type: 'SHOW_CATEGORY_LIST', category, data })
  }, [])

  const handleSelectEmail = useCallback((threadId: string) => {
    panelHost?.dispatchEvent(new CustomEvent('copilot:navigate-thread', { detail: { threadId } }))
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
              // TODO(AI-pipeline): replace N/A once GET /emails/categorized exists
              const mockEmails = [
                { threadId: 'mock-1', clientName: 'Jane Doe', company: 'Acme Corp', subjectSnippet: 'Question about enterprise features', timestamp: '10:30 AM', status: 'ready' as const },
                { threadId: 'mock-2', clientName: 'John Smith', company: 'Globex', subjectSnippet: 'Can we schedule a demo?', timestamp: 'Yesterday', status: 'needs-review' as const },
                { threadId: 'mock-3', clientName: 'Sarah Connor', company: 'Cyberdyne', subjectSnippet: 'Pricing details required', timestamp: 'Oct 12' }
              ]
              return (
                <EmailCategoryList
                  category={panel.category}
                  emails={mockEmails}
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
                  onSend={(reply) => {
                    // TODO: inject reply into Gmail compose
                    console.log('[Copilot] Send reply:', reply)
                  }}
                  onEditInGmail={() => {
                    // TODO: focus Gmail compose window
                    console.log('[Copilot] Open in Gmail compose')
                  }}
                />
              )

            case 'low-confidence':
              return (
                <LowConfidenceScreen
                  data={panel.data}
                  onClose={handleClose}
                  onRefresh={handleRefresh}
                  onComposeManually={() => {
                    // TODO: focus Gmail compose
                    console.log('[Copilot] Compose manually')
                  }}
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
