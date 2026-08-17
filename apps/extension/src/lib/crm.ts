/**
 * CRM action suggestions surfaced by the pipeline.
 *
 * When the backend pauses a thread for human approval, it returns the actions it
 * wants to take against the CRM. The SE approves or ignores each one before they
 * run. These types are the single source of truth shared by the panel actions
 * hook (which loads and resolves them) and the screens that render them.
 */
export interface CrmSuggestion {
  index: number
  summary: string
}

export interface CrmSuggestionResult {
  threadId: string
  isPausedForApproval: boolean
  suggestions: CrmSuggestion[]
}

/** One SE verdict on a suggested CRM action. */
export type CrmDecision = { type: 'approve' | 'reject' }

/**
 * Turn a failed submission into something an SE can act on.
 *
 * The raw text the background produces — "RESUME_CRM_ACTIONS failed: 404" —
 * names an internal message type and an HTTP code, neither of which tells the
 * SE what went wrong or what to do about it. The backend's own messages are no
 * better here: they carry tenant ids.
 *
 * Every 404 on this route comes from the agent factory failing to find a CRM
 * connection for the tenant, so that code maps to one specific, fixable cause.
 */
export function describeCrmSubmitError(status?: number): string {
  if (status === 404) {
    return 'Your CRM is no longer connected. Reconnect it from the dashboard, then try again.'
  }
  if (status === 429) {
    return 'Too many attempts in a row. Wait a moment, then try again.'
  }
  if (status === 408 || status === 504) {
    return 'The request timed out before the CRM answered. Check your connection and try again.'
  }
  if (status !== undefined && status >= 500) {
    return 'Something went wrong on our side. Nothing was written to your CRM — try again in a moment.'
  }
  // No status at all means the request never reached the server: offline, the
  // background worker asleep, a dropped port.
  if (status === undefined) {
    return 'Could not reach the server. Check your connection and try again.'
  }
  return 'Could not submit these actions. Nothing was written to your CRM — try again.'
}
