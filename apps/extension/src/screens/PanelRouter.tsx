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
  /** CRM lookup in flight with nothing cached — the screens show a skeleton. */
  crmLoading: boolean
  /** Verdicts already submitted for this thread — the screens show the banner. */
  crmSubmitted: boolean
  crmSubmitting: boolean
  crmError: string | null
  handlers: PanelRouterHandlers
}

export function PanelRouter({ panel, crmSuggestions, crmLoading, crmSubmitted, crmSubmitting, crmError, handlers }: PanelRouterProps): ReactNode {
  switch (panel.type) {
    case 'auth':
      return <AuthScreen onClose={handlers.onClose} onSignIn={handlers.onSignIn} />

    case 'invalid':
      return (
        <InvalidScreen
          email={panel.email}
          unreachableHost={panel.unreachableHost}
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
          crmLoading={crmLoading}
          crmSubmitted={crmSubmitted}
          crmSubmitting={crmSubmitting}
          crmError={crmError}
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
          crmLoading={crmLoading}
          crmSubmitted={crmSubmitted}
          crmSubmitting={crmSubmitting}
          crmError={crmError}
          onResolveCrmActions={handlers.onResolveCrmActions}
        />
      )

    case 'not-salesbox':
      return (
        <div className="flex flex-col h-full bg-[var(--color-surface)] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Salesbox Copilot</h2>
            <button onClick={handlers.onClose} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center text-center p-4 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-surface-hover)]">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 text-xl">🏷️</div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">Not Related to 'salesbox'</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              This email is not related to <span className="font-mono text-blue-400 font-bold">'salesbox'</span>.
              <br /><br />
              AI classification and copilot features are disabled for emails without the 'salesbox' label.
            </p>
          </div>
        </div>
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
