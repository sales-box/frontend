import mascotSilhouette from '../assets/mascot-icon-silhouette.svg'
import { assetUrl } from '../lib/assetUrl'
import { PanelHeader } from '../components/PanelHeader'
import { LoadingScreen } from './LoadingScreen'
import { useThinkingStages } from '../hooks/useThinkingStages'

/**
 * "Thinking" state for the long AI draft (POST /ai/process, ~20s observed).
 *
 * DESIGN.md E7 deviation: E7 allows the mascot + gradient glow but says
 * "no other typographic treatment". Twenty seconds of silent skeleton reads
 * as stuck rather than working, so this screen adds a rotating status line.
 * The plain skeleton remains the rule for short loads — see PanelRouter,
 * which routes `kind: 'quick'` to LoadingScreen.
 *
 * Nothing here owns a request; failures are handled by the PROCESS_EMAIL
 * path in usePanelActions.
 */
export function ThinkingScreen() {
  const { line, index, total, visible } = useThinkingStages(true)

  // Grace period: show the ordinary skeleton so a cached (~463ms) response
  // never flashes the mascot.
  if (!visible) return <LoadingScreen />

  return (
    <div
      className="flex flex-col h-full bg-[var(--color-surface)]"
      aria-busy="true"
    >
      <PanelHeader />

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Mascot with the gradient glow E7 already sanctions. */}
        <div className="relative mb-7">
          <div
            className="absolute inset-0 -m-5 rounded-full bg-gradient-to-tr from-[var(--color-primary)] via-[#03ABC4] to-[#DF2A57] opacity-25 blur-2xl animate-think-glow"
            aria-hidden="true"
          />
          <img
            src={assetUrl(mascotSilhouette)}
            alt=""
            aria-hidden="true"
            className="relative w-20 h-20 animate-think-float"
          />
        </div>

        {/* The status line. aria-live so stage changes are announced once. */}
        <p
          className="text-sm font-medium text-[var(--color-text-secondary)] min-h-[2.5rem] animate-think-shimmer"
          aria-live="polite"
        >
          {line}
        </p>

        {/* Step dots — filled up to and including the active stage. */}
        <div className="flex gap-2 mt-5" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={
                i <= index
                  ? 'w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]'
                  : 'w-1.5 h-1.5 rounded-full bg-[var(--color-surface-tertiary)]'
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
