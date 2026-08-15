/**
 * Copy for the "thinking" loading state.
 *
 * Stage keys mirror the real LangGraph nodes in the backend
 * (reply-graph.factory.ts: extract → match → compose → feedback), so the
 * line on screen always describes work the pipeline is genuinely doing.
 *
 * Two rules when editing these lines:
 *
 *  1. Dry wit, not quirky startup. An SE may have this panel open while
 *     screen-sharing with a client.
 *  2. Never claim a finding. "Found 3 matching documents" is a lie the
 *     frontend cannot verify — describe activity, never results.
 *
 * Durations are calibrated against real local runs of POST /ai/process:
 * 15.4s, 20.0s and 25.1s. They sum to 17s rather than the ~20s mean on
 * purpose — the last stage HOLDS until the response lands, so finishing the
 * sequence slightly early degrades into a longer hold on "Proofreading…",
 * whereas budgeting too long means the fastest runs never reach the final
 * stage at all. Erring short keeps every stage visible on every run.
 */

export interface ThinkingStage {
  /** Backend graph node this mirrors. */
  key: 'extract' | 'match' | 'compose' | 'feedback'
  /** How long to sit on this stage before advancing, in ms. */
  duration: number
  lines: readonly string[]
}

export const STAGES: readonly ThinkingStage[] = [
  {
    key: 'extract',
    duration: 4_000,
    lines: [
      'Reading the room…',
      'Skimming the thread…',
      'Opening attachments…',
      'Working out what they actually want…',
    ],
  },
  {
    key: 'match',
    duration: 5_000,
    lines: [
      'Digging through your knowledge base…',
      'Consulting the archives…',
      'Finding the receipts…',
      'Hunting down the right spec…',
    ],
  },
  {
    key: 'compose',
    duration: 5_000,
    lines: [
      'Drafting your reply…',
      'Choosing better words…',
      'Making it sound like you…',
      'Writing something worth sending…',
    ],
  },
  {
    key: 'feedback',
    duration: 3_000,
    lines: [
      'Proofreading…',
      'Double-checking the details…',
      'Marking my own homework…',
      'Almost there…',
    ],
  },
] as const

/**
 * Shown once the run outlasts the budget above. Stages stop advancing —
 * claiming a fifth step that does not exist would be a lie — so a slow run
 * reads as continued effort rather than a freeze.
 */
export const OVERTIME_LINES: readonly string[] = [
  'Still thinking…',
  "This one's a puzzle…",
  'Taking the scenic route…',
  'Worth the wait, promise…',
] as const

/** Total expected duration of all stages, in ms. */
export const TOTAL_DURATION = STAGES.reduce((sum, s) => sum + s.duration, 0)

/** How long a single line stays on screen before rotating within its stage. */
export const LINE_ROTATION_MS = 3_500

/**
 * Grace period before the mascot treatment appears. Below this, the panel
 * shows the plain skeleton and a cached (~463ms) response never reaches the
 * mascot at all — no flash.
 */
export const THINKING_DELAY_MS = 400
