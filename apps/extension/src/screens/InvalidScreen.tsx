
import { PanelHeader } from '../components/PanelHeader'
import mascotLocked from '../assets/mascot-locked.png'
import mascotSleepy from '../assets/mascot-sleepy.png'

interface InvalidScreenProps {
  /** The unauthorized email address — shown in mono (scan element) */
  email?: string
  /**
   * The host the request never reached. Set only for transport failures, and
   * shown because the usual cause is an extension built against one API base
   * while the backend runs at another.
   */
  unreachableHost?: string
  errorMsg?: string
  onClose: () => void
  onSwitchAccount: () => void
}

/**
 * Full-panel failure state for the sign-in chain, in two flavours: the server
 * turned the SE away (401/403), or the server was never reached at all. They
 * have nothing in common as problems, so the screen never blurs them — telling
 * someone their account is unapproved sends them into the admin panel looking
 * for a permission that was never the issue.
 *
 * Serif moment: heading "Not <em>authorized</em>." / "Backend <em>unreachable</em>."
 * The email address (or host) stays in mono — it's data to scan, not a headline.
 */
export function InvalidScreen({ email, unreachableHost, errorMsg, onClose, onSwitchAccount }: InvalidScreenProps) {
  const unreachable = unreachableHost !== undefined

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <PanelHeader onClose={onClose} />

      {/* Body */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 text-center">
        {/* The padlock is only honest about a rejection — a dead host is not one */}
        <img src={chrome.runtime.getURL(unreachable ? mascotSleepy : mascotLocked)} alt="" className="w-32 h-32 mb-6" aria-hidden="true" />

        {/* Eyebrow + heading */}
        <p className="text-eyebrow mb-2">{unreachable ? 'CANNOT CONNECT' : 'ACCESS DENIED'}</p>
        <h1
          className="text-heading text-[var(--color-text-primary)] mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {unreachable ? (
            <>Backend{' '}<em className="text-primary not-italic">unreachable.</em></>
          ) : (
            <>Not{' '}<em className="text-primary not-italic">authorized.</em></>
          )}
        </h1>

        <p className="text-small text-[var(--color-text-secondary)] leading-relaxed mb-4 max-w-[220px]">
          {unreachable
            ? 'Nothing answered at this address. Check the backend is running, and that the extension points at it.'
            : 'Your account is not on the approved Sales Engineer list.'}
        </p>

        {/* Host or email in mono — data, not hero */}
        {(unreachableHost || email) && (
          <div className="mb-6 px-3 py-2">
            <span
              className="text-mono text-[var(--color-text-secondary)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {unreachableHost || email}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 border-l-2 border-[var(--color-danger)] pl-3 py-1 max-w-[240px] text-left">
            <span
              className="text-mono text-[var(--color-danger)] text-xs break-words"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {errorMsg}
            </span>
          </div>
        )}

        {/* Back to the sign-in screen — a different account is only the remedy for a rejection */}
        <button
          id="ext-switch-account-btn"
          onClick={onSwitchAccount}
          className="text-small text-[var(--color-secondary)] underline underline-offset-2 hover:text-[var(--color-secondary-hover)] transition-colors cursor-pointer bg-transparent border-none p-0"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {unreachable ? 'Back to sign in' : 'Sign in with a different account'}
        </button>
      </div>
    </div>
  )
}
