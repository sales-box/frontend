import { AlertCircle } from 'lucide-react'
import { PanelHeader } from '../components/PanelHeader'

interface InvalidScreenProps {
  /** The unauthorized email address — shown in mono (scan element) */
  email?: string
  onClose: () => void
  onSwitchAccount: () => void
}

/**
 * "Not authorized" full-panel state.
 * Serif moment: heading "Not <em>authorized</em>."
 * The email address stays in mono — it's data to scan, not a headline.
 */
export function InvalidScreen({ email, onClose, onSwitchAccount }: InvalidScreenProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <PanelHeader onClose={onClose} />

      {/* Body */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 text-center">
        {/* Icon in warning container */}
        <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20 flex items-center justify-center mb-6">
          <AlertCircle size={24} strokeWidth={1.25} className="text-[var(--color-warning)]" />
        </div>

        {/* Eyebrow + heading */}
        <p className="text-eyebrow mb-2">ACCESS DENIED</p>
        <h1
          className="text-heading text-[var(--color-text-primary)] mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Not{' '}
          <em className="italic">authorized.</em>
        </h1>

        <p className="text-small text-[var(--color-text-secondary)] leading-relaxed mb-4 max-w-[220px]">
          Your account is not on the approved Sales Engineer list.
        </p>

        {/* Email in mono — data, not hero */}
        {email && (
          <div className="mb-6 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-tertiary)] border border-[var(--color-border)]">
            <span
              className="text-mono text-[var(--color-text-secondary)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {email}
            </span>
          </div>
        )}

        {/* Switch account link */}
        <button
          id="ext-switch-account-btn"
          onClick={onSwitchAccount}
          className="text-small text-[var(--color-accent)] underline underline-offset-2 hover:text-[var(--color-accent-hover)] transition-colors cursor-pointer bg-transparent border-none p-0"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Sign in with a different account
        </button>
      </div>
    </div>
  )
}
