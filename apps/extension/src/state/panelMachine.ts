import type { BriefingData } from '../screens/BriefingSheet'
import type { LowConfidenceData } from '../screens/LowConfidenceScreen'
import type { InboxOverviewData } from '../screens/InboxOverviewScreen'

export type RepliedSummary = {
  intent: string
  productConfidence: number | null
  clientHistoryConfidence: number | null
  supervisorLabel: string | null
}

export type PanelState =
  | { type: 'collapsed' }
  | { type: 'auth' }
  | { type: 'invalid'; email?: string; errorMsg?: string }
  | { type: 'loading' }
  | { type: 'overview'; data: InboxOverviewData }
  | { type: 'category-list'; category: string; data: InboxOverviewData }
  | { type: 'briefing'; data: BriefingData }
  | { type: 'low-confidence'; data: LowConfidenceData }
  | { type: 'replied'; summary?: RepliedSummary | null }
  | { type: 'revoked' }

export type PanelAction =
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
  | { type: 'SHOW_REPLIED'; summary?: RepliedSummary | null }
  | { type: 'RESET' }

export const initialPanelState: PanelState = { type: 'collapsed' }

export function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'EXPAND':              return { type: 'auth' }
    case 'COLLAPSE':            return { type: 'collapsed' }
    case 'AUTH_FAILED':         return { type: 'invalid', email: action.email, errorMsg: action.errorMsg }
    case 'AUTH_SUCCESS':        return { type: 'loading' }
    case 'REVOKED':             return { type: 'revoked' }
    case 'LOAD_BRIEFING':       return { type: 'loading' }
    case 'SHOW_OVERVIEW':       return { type: 'overview', data: action.data }
    case 'SHOW_CATEGORY_LIST':  return { type: 'category-list', category: action.category, data: action.data }
    case 'SHOW_BRIEFING':       return { type: 'briefing', data: action.data }
    case 'SHOW_LOW_CONFIDENCE': return { type: 'low-confidence', data: action.data }
    case 'SHOW_REPLIED':        return { type: 'replied', summary: action.summary }
    case 'RESET':               return { type: 'auth' }
    default:                    return state
  }
}
