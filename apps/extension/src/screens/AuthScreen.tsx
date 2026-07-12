import { Shield } from 'lucide-react'
import { PanelHeader } from '../components/PanelHeader'

interface AuthScreenProps {
  onClose: () => void
  onSignIn: () => void
}

/**
 * Full-panel sign-in screen.
 *
 * DESIGN.md serif moment: heading "Sign in to <em>continue</em>."
 * One italic accent, one serif heading. Nothing else gets the treatment.
 */
export function AuthScreen({ onClose, onSignIn }: AuthScreenProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <PanelHeader onClose={onClose} />

      {/* Body */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 text-center">
        {/* Icon */}
        <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] flex items-center justify-center mb-6">
          <Shield size={24} strokeWidth={1.25} className="text-[var(--color-text-secondary)]" />
        </div>

        {/* Eyebrow + heading — the serif moment */}
        <p className="text-eyebrow mb-2">SIGN IN</p>
        <h1
          className="text-heading text-[var(--color-text-primary)] mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Sign in to{' '}
          <em className="italic">continue.</em>
        </h1>

        {/* Sub-caption */}
        <p className="text-small text-[var(--color-text-secondary)] leading-relaxed mb-8 max-w-[220px]">
          Connect your Sales Engineer account to access AI-powered reply suggestions.
        </p>

        {/* Google sign-in button — btn-secondary styling (ghost), not ink */}
        <button
          id="ext-google-signin-btn"
          onClick={onSignIn}
          className="
            w-full flex items-center justify-center gap-2.5
            px-4 py-2.5 rounded-[var(--radius-sm)]
            border border-[var(--color-border)]
            bg-[var(--color-surface)]
            text-caption text-[var(--color-text-primary)]
            hover:bg-[var(--color-surface-tertiary)]
            transition-colors duration-150
            cursor-pointer
          "
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {/* Google "G" SVG */}
          <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
