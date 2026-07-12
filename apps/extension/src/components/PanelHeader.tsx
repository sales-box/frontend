import { RefreshCw, X, Inbox } from 'lucide-react'

interface PanelHeaderProps {
  showRefresh?: boolean
  onRefresh?: () => void
  onClose?: () => void
  /** Greyed out — used by RevokedScreen */
  muted?: boolean
}

/**
 * Reusable top bar for the extension panel.
 * Logo + "Inbox Copilot" wordmark + optional Refresh + Close buttons.
 */
export function PanelHeader({ showRefresh, onRefresh, onClose, muted }: PanelHeaderProps) {
  const logoColor = muted
    ? 'bg-[var(--color-surface-tertiary)]'
    : 'bg-[var(--color-primary)]'
  const wordmarkColor = muted
    ? 'text-[var(--color-text-tertiary)]'
    : 'text-[var(--color-text-primary)]'

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0 transition-colors ${logoColor}`}
        >
          <Inbox size={12} strokeWidth={1.5} className="text-[var(--color-text-on-primary)]" />
        </div>
        <span
          className={`text-caption font-semibold tracking-tight transition-colors ${wordmarkColor}`}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Inbox Copilot
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {showRefresh && (
          <button
            onClick={onRefresh}
            aria-label="Refresh"
            className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors cursor-pointer"
          >
            <RefreshCw size={13} strokeWidth={1.5} />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors cursor-pointer"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}
