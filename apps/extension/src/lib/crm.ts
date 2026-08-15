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
