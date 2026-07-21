import type { BriefingData } from '../screens/BriefingSheet'
import type { LowConfidenceData } from '../screens/LowConfidenceScreen'
import type { InboxOverviewData } from '../screens/InboxOverviewScreen'
import type { EmailRowData } from '../screens/EmailCategoryList'

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
  | {
      type: 'category-list'
      category: string
      parent: InboxOverviewData
      emails: EmailRowData[]
      loading: boolean
      error?: string
    }
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
  | { type: 'CATEGORY_LOADING' }
  | { type: 'CATEGORY_LOADED'; emails: EmailRowData[] }
  | { type: 'CATEGORY_FAILED'; message: string }
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
    case 'SHOW_CATEGORY_LIST':  return { type: 'category-list', category: action.category, parent: action.data, emails: [], loading: true }
    case 'CATEGORY_LOADING':
      if (state.type !== 'category-list') return state
      return { ...state, loading: true, error: undefined }
    case 'CATEGORY_LOADED':
      if (state.type !== 'category-list') return state
      return { ...state, emails: action.emails, loading: false, error: undefined }
    case 'CATEGORY_FAILED':
      if (state.type !== 'category-list') return state
      return { ...state, loading: false, error: action.message }
    case 'SHOW_BRIEFING':       return { type: 'briefing', data: action.data }
    case 'SHOW_LOW_CONFIDENCE': return { type: 'low-confidence', data: action.data }
    case 'SHOW_REPLIED':        return { type: 'replied', summary: action.summary }
    case 'RESET':               return { type: 'auth' }
    default:                    return state
  }
}

