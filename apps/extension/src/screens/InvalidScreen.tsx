
import { PanelHeader } from '../components/PanelHeader'
import mascotLocked from '../assets/mascot-locked.png'

interface InvalidScreenProps {
  /** The unauthorized email address — shown in mono (scan element) */
  email?: string
  errorMsg?: string
  onClose: () => void
  onSwitchAccount: () => void
}

/**
 * "Not authorized" full-panel state.
 * Serif moment: heading "Not <em>authorized</em>."
 * The email address stays in mono — it's data to scan, not a headline.
 */
export function InvalidScreen({ email, errorMsg, onClose, onSwitchAccount }: InvalidScreenProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <PanelHeader onClose={onClose} />

      {/* Body */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 text-center">
        <img src={chrome.runtime.getURL(mascotLocked)} alt="" className="w-32 h-32 mb-6" aria-hidden="true" />

        {/* Eyebrow + heading */}
        <p className="text-eyebrow mb-2">ACCESS DENIED</p>
        <h1
          className="text-heading text-[var(--color-text-primary)] mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Not{' '}
          <em className="text-primary not-italic">authorized.</em>
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

        {errorMsg && (
          <div className="mb-6 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-tertiary)] border border-red-500 max-w-[240px] text-left">
            <span
              className="text-mono text-red-500 text-xs break-words"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {errorMsg}
            </span>
          </div>
        )}

        {/* Switch account link */}
        <button
          id="ext-switch-account-btn"
          onClick={onSwitchAccount}
          className="text-small text-[var(--color-secondary)] underline underline-offset-2 hover:text-[var(--color-secondary-hover)] transition-colors cursor-pointer bg-transparent border-none p-0"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Sign in with a different account
        </button>
      </div>
    </div>
  )
}
