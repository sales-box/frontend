import { useCallback, useRef, useState } from 'react'
import type React from 'react'
import type { PanelAction } from '../state/panelMachine'
import type { InboxOverviewData } from '../screens/InboxOverviewScreen'
import type { EmailRowData } from '../screens/EmailCategoryList'
import { useAsyncAction, type ToastState } from './useAsyncAction'
import { sendToBackground, handleAuthErr } from '../services/backgroundBridge'
import { setSession } from '../state/session'
import { derivePipelineScreen, type PipelineResponse } from '../lib/derivePipelineScreen'
import { getCachedDraft, setCachedDraft } from '../lib/draftCache'
import { getCachedCrm, setCachedCrm, setCachedCrmSubmitted } from '../lib/crmCache'
import { describeCrmSubmitError, type CrmSuggestionResult, type CrmDecision } from '../lib/crm'

export interface PanelActions {
  /** Load the inbox overview (category counts). */
  fetchStats: () => Promise<void>
  /** Load the briefing for a thread; `force` skips the draft cache. */
  loadBriefing: (emailId?: string | null, force?: boolean) => Promise<void>
  /** Load the emails in a category and show the list. */
  selectCategory: (category: string, data: InboxOverviewData) => Promise<void>
  /** The active error toast from whichever action last failed, or null. */
  toast: ToastState | null
  /** CRM actions the pipeline paused for approval, or null when there are none. */
  crmSuggestions: CrmSuggestionResult | null
  /** True while the CRM lookup is in flight and nothing was cached to show. */
  crmLoading: boolean
  /** True once the backend confirmed the verdicts — survives a reopen. */
  crmSubmitted: boolean
  /** True while the verdicts are in flight. */
  crmSubmitting: boolean
  /** Set when the submission failed, so the panel never fakes a success. */
  crmError: string | null
  /** Send the SE's approve/ignore verdicts for the paused CRM actions. */
  resolveCrmActions: (decisions: CrmDecision[]) => Promise<void>
  /** Report that the current thread exposed a gap in the knowledge base. */
  reportGap: () => Promise<{ occurrences: number; reportAdded: boolean }>
  /**
   * Read-and-clear the graph thread id captured by the last briefing load. The
   * id rides along a single "insert in Gmail" event, so consuming it prevents a
   * stale id leaking into a later, unrelated insert.
   */
  consumeGraphThreadId: () => string | null
}

export function usePanelActions(deps: {
  dispatch: React.Dispatch<PanelAction>
  resolveMessageId: () => Promise<string | null>
  getCurrentMessageId: () => string | null
}): PanelActions {
  const { dispatch, resolveMessageId, getCurrentMessageId } = deps

  // Monotonic token: only the LATEST loadSuggestion may dispatch. Without it,
  // two rapid thread opens race and the slower response wins — rendering the
  // wrong email's briefing (the flicker).
  const loadSeqRef = useRef(0)
  // True while a briefing is being fetched. Gmail fires a second `hashchange`
  // shortly after a thread opens, and on that tick the URL can momentarily read
  // as "not in a thread" — which sent fetchStats through and replaced the
  // loading skeleton with the inbox overview mid-request. On a cold email the
  // pipeline takes tens of seconds, so the overview sat there until the
  // briefing finally resolved and swapped itself back in.
  const briefingInFlightRef = useRef(false)
  const graphThreadIdRef = useRef<string | null>(null)

  // CRM actions — restored from cache, or populated non-blocking after the
  // briefing renders.
  const [crmSuggestions, setCrmSuggestions] = useState<CrmSuggestionResult | null>(null)
  const [crmLoading, setCrmLoading] = useState(false)
  const [crmSubmitted, setCrmSubmitted] = useState(false)
  const [crmSubmitting, setCrmSubmitting] = useState(false)
  const [crmError, setCrmError] = useState<string | null>(null)

  // Set after the loaders exist. Each action clears the *other* actions' toasts
  // so a stale failure from a previous screen can't outrank the current one in
  // the priority chain below.
  const clearOtherToasts = useRef<{ stats?: () => void; briefing?: () => void; category?: () => void }>({})

  const fetchInboxStatsInner = useCallback(async () => {
    clearOtherToasts.current.briefing?.()
    clearOtherToasts.current.category?.()
    const res = await sendToBackground<InboxOverviewData>({ type: 'GET_INBOX_STATS' })
    if (await handleAuthErr(res, dispatch)) return
    if (!res.ok) throw new Error(res.kind === 'error' ? res.message : res.kind)
    await setSession({ cachedInboxStats: res.data })
    // Cache the stats either way, but never navigate away from a briefing the
    // user is already waiting on.
    if (briefingInFlightRef.current) return
    dispatch({ type: 'SHOW_OVERVIEW', data: res.data })
  }, [dispatch])

  const loadSuggestionInner = useCallback(async (emailId?: string | null, force = false) => {
    clearOtherToasts.current.stats?.()
    clearOtherToasts.current.category?.()
    let resolvedId = emailId
    if (!resolvedId) {
      resolvedId = await resolveMessageId()
    }
    if (!resolvedId) {
      throw new Error('No open Gmail thread detected')
    }
    // Captured so the async .then() below can't observe a reassigned id.
    const messageId = resolvedId
    const seq = ++loadSeqRef.current
    dispatch({ type: 'LOAD_BRIEFING' })
    briefingInFlightRef.current = true
    try {
      let raw: PipelineResponse | null = force ? null : await getCachedDraft(messageId)

      // Reset CRM state for this load — always start clean.
      setCrmSuggestions(null)
      setCrmSubmitted(false)
      setCrmError(null)
      setCrmSubmitting(false)

      // The CRM cache is consulted independently of the draft cache: a cached
      // draft can pair with a fresh or invalidated CRM entry, and vice versa.
      const cachedCrm = force ? null : await getCachedCrm(messageId)

      if (cachedCrm) {
        // Restore instantly — no skeleton, no network call.
        setCrmSuggestions(cachedCrm.suggestions)
        setCrmSubmitted(cachedCrm.submitted)
        setCrmLoading(false)
      } else {
        setCrmLoading(true)
      }

      // Fire the CRM lookup alongside PROCESS_EMAIL so the two run concurrently.
      const crmSuggestionPromise = !cachedCrm
        ? sendToBackground<CrmSuggestionResult>({ type: 'SUGGEST_CRM_ACTIONS', messageId })
        : null

      if (!raw) {
        const res = await sendToBackground<PipelineResponse>({ type: 'PROCESS_EMAIL', messageId })
        if (await handleAuthErr(res, dispatch)) return
        if (!res.ok) throw new Error(res.kind === 'error' ? res.message : res.kind)
        raw = res.data
        await setCachedDraft(messageId, raw)
      }

      if (seq !== loadSeqRef.current) return

      graphThreadIdRef.current = raw.graphThreadId ?? null

      const derived = derivePipelineScreen(raw)
      if (derived.kind === 'replied') dispatch({ type: 'SHOW_REPLIED', summary: derived.summary })
      else if (derived.kind === 'briefing') dispatch({ type: 'SHOW_BRIEFING', data: derived.data })
      else dispatch({ type: 'SHOW_LOW_CONFIDENCE', data: derived.data })

      // Non-blocking: the suggestions land after the briefing renders, and only
      // when the backend actually paused the thread for approval.
      if (crmSuggestionPromise) {
        crmSuggestionPromise
          .then((crmRes) => {
            const suggestions = crmRes.ok && crmRes.data.isPausedForApproval ? crmRes.data : null
            // Cache keyed by message id, so this is safe even if the SE has
            // moved on; the state writes below are not, hence the seq guard.
            void setCachedCrm(messageId, suggestions, false)
            if (seq !== loadSeqRef.current) return
            if (suggestions) setCrmSuggestions(suggestions)
            setCrmLoading(false)
          })
          .catch((err) => {
            console.error('[Copilot] Failed to fetch CRM suggestions:', err)
            if (seq === loadSeqRef.current) setCrmLoading(false)
          })
      }
    } finally {
      // Only the newest load clears the flag — an older, superseded run must not
      // reopen the door while its replacement is still fetching.
      if (seq === loadSeqRef.current) briefingInFlightRef.current = false
    }
  }, [dispatch, resolveMessageId])

  const selectCategoryInner = useCallback(async (category: string, data: InboxOverviewData) => {
    clearOtherToasts.current.stats?.()
    clearOtherToasts.current.briefing?.()
    dispatch({ type: 'SHOW_CATEGORY_LIST', category, data })
    const res = await sendToBackground<{ emails: EmailRowData[] }>({ type: 'GET_CATEGORIZED_EMAILS', category })
    if (await handleAuthErr(res, dispatch)) return
    if (!res.ok) {
      dispatch({ type: 'CATEGORY_FAILED', message: res.kind === 'error' ? res.message : res.kind })
      throw new Error("Couldn't load these emails.")
    }
    dispatch({ type: 'CATEGORY_LOADED', emails: res.data.emails || [] })
  }, [dispatch])

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

  const statsLoader = useAsyncAction(fetchInboxStatsInner, formatStatsError)
  const briefingLoader = useAsyncAction(loadSuggestionInner, formatBriefingError)
  const categoryLoader = useAsyncAction(selectCategoryInner, formatCategoryError)

  clearOtherToasts.current = {
    stats: statsLoader.clearToast,
    briefing: briefingLoader.clearToast,
    category: categoryLoader.clearToast,
  }

  const resolveCrmActions = useCallback(async (decisions: CrmDecision[]) => {
    const threadId = crmSuggestions?.threadId
    if (!threadId) return
    setCrmSubmitting(true)
    setCrmError(null)

    const res = await sendToBackground({ type: 'RESUME_CRM_ACTIONS', threadId, decisions })
    setCrmSubmitting(false)

    if (await handleAuthErr(res, dispatch)) return
    if (!res.ok) {
      // The banner used to be set before this call and never reconciled, so a
      // failed resume — a disconnected CRM, a dropped request — still read as
      // "submitted successfully". Approvals are writes to the user's CRM; the
      // panel must not claim one happened when it did not.
      console.error('[Copilot] resumeCrmActions failed:', res)
      setCrmError(describeCrmSubmitError(res.kind === 'error' ? res.status : undefined))
      return
    }

    // Mark submitted rather than clearing: the success banner has to survive a
    // panel collapse/reopen without the action list coming back.
    setCrmSubmitted(true)
    const messageId = getCurrentMessageId()
    if (messageId) void setCachedCrmSubmitted(messageId)
  }, [crmSuggestions, getCurrentMessageId, dispatch])

  const reportGap = useCallback(async () => {
    const messageId = getCurrentMessageId() ?? await resolveMessageId()
    if (!messageId) throw new Error('No open Gmail thread detected')
    const res = await sendToBackground<{ occurrences: number; reportAdded: boolean }>({
      type: 'REPORT_KNOWLEDGE_GAP',
      messageId,
    })
    if (!res.ok) {
      throw new Error(res.kind === 'error' ? res.message : res.kind)
    }
    return res.data
  }, [getCurrentMessageId, resolveMessageId])

  const consumeGraphThreadId = useCallback(() => {
    const id = graphThreadIdRef.current
    graphThreadIdRef.current = null
    return id
  }, [])

  return {
    fetchStats: statsLoader.run,
    loadBriefing: briefingLoader.run,
    selectCategory: categoryLoader.run,
    // Priority: a briefing/stats failure the SE is waiting on wins over a
    // background category error.
    toast: statsLoader.toast ?? briefingLoader.toast ?? categoryLoader.toast,
    crmSuggestions,
    crmLoading,
    crmSubmitted,
    crmSubmitting,
    crmError,
    resolveCrmActions,
    reportGap,
    consumeGraphThreadId,
  }
}
