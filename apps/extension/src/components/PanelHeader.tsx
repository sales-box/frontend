import { RefreshCw, X } from 'lucide-react'
import { LogoMark } from './LogoMark'

interface PanelHeaderProps {
  showRefresh?: boolean
  onRefresh?: () => void
  onClose?: () => void
  /** Greyed out — used by RevokedScreen */
  muted?: boolean
}

/**
 * Reusable top bar for the extension panel.
 * Uses the actual brand logo (lightning bolt) instead of a plain violet circle.
 * Enhanced with gradient accent line and smooth micro-interactions.
 */
export function PanelHeader({ showRefresh, onRefresh, onClose, muted }: PanelHeaderProps) {
  const logoContainerClass = muted
    ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'
    : 'bg-[var(--color-primary)] text-white'

  const wordmarkColor = muted
    ? 'text-[var(--color-text-tertiary)]'
    : 'text-[var(--color-text-primary)]'

  return (
    <div className="flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          {/* Logo container */}
          <div
            className={`
              w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0
              transition-opacity duration-200 hover:opacity-90
              ${logoContainerClass}
            `}
          >
            <LogoMark size={18} color="currentColor" />
          </div>

          <div className="flex flex-col">
            <span
              className={`text-[13px] font-bold tracking-tight leading-none transition-colors ${wordmarkColor}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Inbox Copilot
            </span>
            {!muted && (
              <span
                className="text-[9px] font-medium tracking-wider uppercase text-[var(--color-text-tertiary)] leading-none mt-0.5"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                AI Sales Assistant
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {showRefresh && (
            <button
              onClick={onRefresh}
              aria-label="Refresh"
              className="
                p-1.5 rounded-[var(--radius-sm)]
                text-[var(--color-text-tertiary)]
                hover:text-[var(--color-primary)]
                hover:bg-[var(--color-surface-tertiary)]
                transition-all duration-150
                cursor-pointer
                active:scale-90
              "
            >
              <RefreshCw size={13} strokeWidth={1.5} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="
                p-1.5 rounded-[var(--radius-sm)]
                text-[var(--color-text-tertiary)]
                hover:text-[var(--color-text-primary)]
                hover:bg-[var(--color-surface-tertiary)]
                transition-all duration-150
                cursor-pointer
                active:scale-90
              "
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
