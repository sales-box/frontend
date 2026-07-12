import { useEffect, useReducer, useCallback } from 'react'
import { seLoginWithCode, getSuggestion } from '@inbox-sales/shared'
import type { BriefingData } from './screens/BriefingSheet'
import type { LowConfidenceData } from './screens/LowConfidenceScreen'
import { InboxStatsScreen, type InboxStatsData } from './screens/InboxStatsScreen'

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
  | { type: 'invalid'; email?: string }
  | { type: 'loading' }
  | { type: 'stats'; data: InboxStatsData }
  | { type: 'briefing'; data: BriefingData }
  | { type: 'low-confidence'; data: LowConfidenceData }
  | { type: 'revoked' }

type PanelAction =
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE' }
  | { type: 'AUTH_FAILED'; email?: string }
  | { type: 'AUTH_SUCCESS' }
  | { type: 'REVOKED' }
  | { type: 'LOAD_BRIEFING' }
  | { type: 'SHOW_STATS'; data: InboxStatsData }
  | { type: 'SHOW_BRIEFING'; data: BriefingData }
  | { type: 'SHOW_LOW_CONFIDENCE'; data: LowConfidenceData }
  | { type: 'RESET' }

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'EXPAND':        return { type: 'auth' }
    case 'COLLAPSE':      return { type: 'collapsed' }
    case 'AUTH_FAILED':   return { type: 'invalid', email: action.email }
    case 'AUTH_SUCCESS':  return { type: 'loading' }
    case 'REVOKED':       return { type: 'revoked' }
    case 'LOAD_BRIEFING': return { type: 'loading' }
    case 'SHOW_STATS':    return { type: 'stats', data: action.data }
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
}

export default function App({ panelHost }: AppProps = {}) {
  const [panel, dispatch] = useReducer(panelReducer, { type: 'collapsed' })

  // On mount: we no longer auto-expand. We just wait for user action.
  useEffect(() => {
    // Intentionally empty. Decoupled auth state from panel expansion.
  }, [])

  const loadSuggestion = useCallback(async (tenantId: string, emailId: string) => {
    try {
      const suggestion = await getSuggestion(tenantId, emailId)
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

  // ── Auth flow ────────────────────────────────────────────────────────────
  const handleSignIn = useCallback(async () => {
    dispatch({ type: 'AUTH_SUCCESS' })
    try {
      // In the real extension, we'll receive a Google auth code from the OAuth popup.
      // For now, mock it. DO NOT CHANGE — Karim owns the real auth flow.
      const result = await seLoginWithCode('mock-google-auth-code')

      if ('error' in result) {
        // invalid_allowlist — not on the approved SE list
        dispatch({ type: 'AUTH_FAILED' })
        return
      }

      // Store JWT for persistence
      const tenantId = 'mock-tenant-001'
      await chrome.storage.local.set({ jwt: result.token, tenantId })

      // Real inbox stats — independent of the mocked auth above.
      // Background worker owns chrome.identity + the real backend fetch (CORS-exempt).
      const statsResult = await chrome.runtime.sendMessage({ type: 'GET_INBOX_STATS' })
      if (statsResult?.error) {
        // Real failure — surface it, do NOT silently fall back to mock briefing.
        console.error('[Copilot] Inbox stats failed:', statsResult.error)
        dispatch({ type: 'AUTH_FAILED' })
        return
      }

      dispatch({
        type: 'SHOW_STATS',
        data: {
          totalEmails: statsResult.totalEmails,
          processedByAI: 0, // ⚠️ MOCK — /ai/process is still a 501 stub on the backend
          syncedAt: statsResult.syncedAt,
        },
      })
    } catch {
      dispatch({ type: 'AUTH_FAILED' })
    }
  }, [loadSuggestion])

  const handleRefresh = useCallback(async () => {
    dispatch({ type: 'LOAD_BRIEFING' })
    const { tenantId } = await chrome.storage.local.get('tenantId')
    if (tenantId) await loadSuggestion(tenantId, 'current-email')
  }, [loadSuggestion])

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
      dispatch({ type: 'LOAD_BRIEFING' })
      await loadSuggestion(tenantId, 'current-email')
    }
  }, [loadSuggestion, panelHost])

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
                  onClose={handleClose}
                  onSwitchAccount={handleSwitchAccount}
                />
              )

            case 'loading':
              return <LoadingScreen />

            case 'stats':
              return (
                <InboxStatsScreen
                  data={panel.data}
                  onClose={handleClose}
                  onContinue={async () => {
                    dispatch({ type: 'LOAD_BRIEFING' })
                    const { tenantId } = await chrome.storage.local.get('tenantId')
                    if (tenantId) await loadSuggestion(tenantId, 'current-email')
                  }}
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
