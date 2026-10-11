import { useCallback, useEffect, useRef } from "react"
import { animate, useMotionValue } from "motion/react"
import type { AnimationPlaybackControls } from "motion/react"
import { computeTarget, dividerCount } from "./geometry"
import { SEGMENTS, SEGMENT_ANGLE } from "./segments"

const FULL_TURNS = 5
const REDUCED_TURNS = 1
const SPIN_DURATION_S = 4.2
const REDUCED_DURATION_S = 0.7
/** Overshoot stays below the 0.15 * segment-angle margin of the safe zone. */
const OVERSHOOT = 0.1 * SEGMENT_ANGLE
const FLICK_ANGLE = -22

export type SpinResult = "done" | "cancelled"

interface UseSpinOptions {
  reducedMotion: boolean
  onDivider: () => void
}

export function useSpin({ reducedMotion, onDivider }: UseSpinOptions) {
  const rotation = useMotionValue(0)
  const flick = useMotionValue(0)
  const runId = useRef(0)
  const wheelControls = useRef<AnimationPlaybackControls | null>(null)
  const flickControls = useRef<AnimationPlaybackControls | null>(null)
  // Resolves the pending spin promise as "cancelled" (a stopped animation never settles on its own).
  const cancelPending = useRef<(() => void) | null>(null)
  const onDividerRef = useRef(onDivider)

  useEffect(() => {
    onDividerRef.current = onDivider
  }, [onDivider])

  const stop = useCallback(() => {
    runId.current += 1
    wheelControls.current?.stop()
    flickControls.current?.stop()
    wheelControls.current = null
    flickControls.current = null
    cancelPending.current?.()
    cancelPending.current = null
  }, [])

  useEffect(() => stop, [stop])

  const spin = useCallback(
    (winnerIndex: number): Promise<SpinResult> => {
      stop()
      const id = runId.current
      const turns = reducedMotion ? REDUCED_TURNS : FULL_TURNS
      const u = Math.random() * 2 - 1
      const target = computeTarget(rotation.get(), winnerIndex, SEGMENTS.length, turns, u)

      return new Promise<SpinResult>((resolve) => {
        let lastCount = dividerCount(rotation.get(), SEGMENT_ANGLE)
        const unsubscribe = reducedMotion
          ? () => {}
          : rotation.on("change", (value) => {
              const count = dividerCount(value, SEGMENT_ANGLE)
              if (count === lastCount) return
              lastCount = count
              flickControls.current?.stop()
              flickControls.current = animate(flick, [FLICK_ANGLE, 0], {
                type: "spring",
                stiffness: 500,
                damping: 14,
              })
              onDividerRef.current()
            })

        const finish = (result: SpinResult) => {
          unsubscribe()
          resolve(result)
        }
        cancelPending.current = () => finish("cancelled")

        const complete = () => {
          if (runId.current !== id) return
          cancelPending.current = null
          wheelControls.current = null
          finish("done")
        }

        if (reducedMotion) {
          wheelControls.current = animate(rotation, target, {
            duration: REDUCED_DURATION_S,
            ease: "easeOut",
          })
          wheelControls.current.finished.then(complete)
          return
        }

        wheelControls.current = animate(rotation, target + OVERSHOOT, {
          duration: SPIN_DURATION_S,
          ease: [0.17, 0.89, 0.35, 1],
        })
        wheelControls.current.finished.then(() => {
          if (runId.current !== id) return
          wheelControls.current = animate(rotation, target, {
            type: "spring",
            stiffness: 120,
            damping: 20,
          })
          wheelControls.current.finished.then(complete)
        })
      })
    },
    [flick, reducedMotion, rotation, stop]
  )

  return { rotation, flick, spin }
}
