import type { ReactNode } from 'react'
import type { PanelState } from '../state/panelMachine'
import type { InboxOverviewData } from './InboxOverviewScreen'
import type { CrmSuggestionResult, CrmDecision } from '../lib/crm'

import { AuthScreen } from './AuthScreen'
import { InvalidScreen } from './InvalidScreen'
import { LoadingScreen } from './LoadingScreen'
import { InboxOverviewScreen } from './InboxOverviewScreen'
import { EmailCategoryList } from './EmailCategoryList'
import { BriefingSheet } from './BriefingSheet'
import { LowConfidenceScreen } from './LowConfidenceScreen'
import { RepliedScreen } from './RepliedScreen'
import { RevokedScreen } from './RevokedScreen'

export interface PanelRouterHandlers {
  onClose: () => void
  onSignIn: () => Promise<void>
  onSwitchAccount: () => Promise<void>
  onRefresh: () => Promise<void>
  onSelectCategory: (category: string, data: InboxOverviewData) => Promise<void>
  onSelectEmail: (threadId: string) => Promise<void>
  onEditInGmail: (reply: string) => void
  onBackToOverview: (parent: InboxOverviewData) => void
  onReportGap: () => Promise<{ occurrences: number; reportAdded: boolean }>
  onResolveCrmActions: (decisions: CrmDecision[]) => void
}

interface PanelRouterProps {
  panel: PanelState
  /** CRM actions paused for approval, shown on the briefing / low-confidence screens. */
  crmSuggestions: CrmSuggestionResult | null
  handlers: PanelRouterHandlers
}

export function PanelRouter({ panel, crmSuggestions, handlers }: PanelRouterProps): ReactNode {
  switch (panel.type) {
    case 'auth':
      return <AuthScreen onClose={handlers.onClose} onSignIn={handlers.onSignIn} />

    case 'invalid':
      return (
        <InvalidScreen
          email={panel.email}
          errorMsg={panel.errorMsg}
          onClose={handlers.onClose}
          onSwitchAccount={handlers.onSwitchAccount}
        />
      )

    case 'loading':
      return <LoadingScreen />

    case 'overview':
      return (
        <InboxOverviewScreen
          data={panel.data}
          onClose={handlers.onClose}
          onSelectCategory={(category) => handlers.onSelectCategory(category, panel.data)}
        />
      )

    case 'category-list':
      return (
        <EmailCategoryList
          category={panel.category}
          emails={panel.emails}
          loading={panel.loading}
          onClose={handlers.onClose}
          onBack={() => handlers.onBackToOverview(panel.parent)}
          onSelectEmail={handlers.onSelectEmail}
        />
      )

    case 'briefing':
      return (
        <BriefingSheet
          data={panel.data}
          onClose={handlers.onClose}
          onRefresh={handlers.onRefresh}
          onInsertInGmail={handlers.onEditInGmail}
          onReportGap={handlers.onReportGap}
          crmSuggestions={crmSuggestions}
          onResolveCrmActions={handlers.onResolveCrmActions}
        />
      )

    case 'low-confidence':
      return (
        <LowConfidenceScreen
          data={panel.data}
          onClose={handlers.onClose}
          onRefresh={handlers.onRefresh}
          onComposeManually={() => handlers.onEditInGmail('')}
          onInsertDraft={(reply) => handlers.onEditInGmail(reply)}
          onReportGap={handlers.onReportGap}
          crmSuggestions={crmSuggestions}
          onResolveCrmActions={handlers.onResolveCrmActions}
        />
      )

    case 'replied':
      return <RepliedScreen summary={panel.summary ?? null} onClose={handlers.onClose} />

    case 'revoked':
      return <RevokedScreen onClose={handlers.onClose} />

    case 'collapsed':
      // Should never reach here — App.tsx short-circuits to <CollapsedTab> for collapsed state.
      return null

    default: {
      // Exhaustiveness check: TS will error if a PanelState variant is unhandled.
      const _exhaustive: never = panel
      return _exhaustive
    }
  }
}
