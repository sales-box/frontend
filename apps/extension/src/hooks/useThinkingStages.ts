import { useEffect, useRef, useState } from 'react'
import { STAGES, LINE_ROTATION_MS } from '../screens/thinking-copy'
import {
  stageAt,
  isOvertime,
  isVisible,
  poolAt,
  pickLine,
} from '../screens/thinking-timeline'

export interface ThinkingState {
  /** Current line to display. Empty while inside the grace period. */
  line: string
  /** Index of the active stage, 0-based — drives the step dots. */
  index: number
  /** Total number of stages. */
  total: number
  /** True once the grace period has elapsed and the mascot should show. */
  visible: boolean
  /** True once the run outlasts the stage budget. */
  overtime: boolean
}

/**
 * Drives the thinking-state copy on a timer.
 *
 * There is no progress signal from the backend — POST /ai/process is a single
 * request/response — so timings are calibrated to observed runs rather than
 * reported. All decisions live in thinking-timeline.ts; this hook only owns
 * the clock and the rotation interval.
 */
export function useThinkingStages(active: boolean): ThinkingState {
  const [elapsed, setElapsed] = useState(0)
  const [line, setLine] = useState('')
  const startedAt = useRef<number | null>(null)
  // Read inside the rotation interval without making it a dependency, which
  // would restart the interval on every line change.
  const lineRef = useRef('')

  useEffect(() => {
    lineRef.current = line
  }, [line])

  useEffect(() => {
    if (!active) {
      startedAt.current = null
      setElapsed(0)
      setLine('')
      return
    }

    startedAt.current = Date.now()
    const tick = setInterval(() => {
      if (startedAt.current !== null) setElapsed(Date.now() - startedAt.current)
    }, 250)

    return () => clearInterval(tick)
  }, [active])

  const index = stageAt(elapsed)
  const overtime = isOvertime(elapsed)
  const visible = isVisible(elapsed)

  // Re-seed on stage change, then rotate within the stage.
  useEffect(() => {
    if (!active) return

    const pool = overtime ? poolAt(Infinity) : STAGES[index].lines
    setLine(pickLine(pool, lineRef.current))

    const rotate = setInterval(() => {
      setLine(pickLine(pool, lineRef.current))
    }, LINE_ROTATION_MS)

    return () => clearInterval(rotate)
  }, [active, index, overtime])

  return { line: visible ? line : '', index, total: STAGES.length, visible, overtime }
}
