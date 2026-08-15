/**
 * Pure timeline logic for the thinking state.
 *
 * Kept free of React so it can be tested directly — the repo's test suite is
 * logic-only (no @testing-library), and this is where the real behaviour
 * lives. useThinkingStages is a thin wrapper that just supplies elapsed time.
 */
import { STAGES, OVERTIME_LINES, TOTAL_DURATION, THINKING_DELAY_MS } from './thinking-copy'

/**
 * Maps elapsed ms to a stage index.
 *
 * Clamps to the LAST stage rather than running off the end: the sequence must
 * never complete on its own, because the response has not arrived yet.
 */
export function stageAt(elapsed: number): number {
  let acc = 0
  for (let i = 0; i < STAGES.length; i++) {
    acc += STAGES[i].duration
    if (elapsed < acc) return i
  }
  return STAGES.length - 1
}

/** True once the run outlasts the whole stage budget. */
export function isOvertime(elapsed: number): boolean {
  return elapsed >= TOTAL_DURATION
}

/** True once the grace period has passed and the mascot may appear. */
export function isVisible(elapsed: number): boolean {
  return elapsed >= THINKING_DELAY_MS
}

/** The pool of lines in play at a given moment. */
export function poolAt(elapsed: number): readonly string[] {
  return isOvertime(elapsed) ? OVERTIME_LINES : STAGES[stageAt(elapsed)].lines
}

/**
 * Picks a line from `pool`, avoiding an immediate repeat of `previous`.
 * `random` is injectable so tests are deterministic.
 */
export function pickLine(
  pool: readonly string[],
  previous: string,
  random: () => number = Math.random,
): string {
  const candidates = pool.filter((l) => l !== previous)
  const choices = candidates.length > 0 ? candidates : pool
  return choices[Math.floor(random() * choices.length)]
}
