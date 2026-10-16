import { useCallback, useRef } from "react"
import type { Challenge, Segment } from "./segments"

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const array = [...items]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/** Builds one cycle of segment indices alternating challenges, starting with `startChallenge`. */
export function buildCycle(
  segments: readonly Segment[],
  startChallenge: Challenge,
  rng: () => number = Math.random
): number[] {
  const groups: Record<Challenge, number[]> = { 1: [], 2: [] }
  segments.forEach((segment, index) => groups[segment.challenge].push(index))

  if (import.meta.env.DEV) {
    if (groups[1].length === 0 || groups[1].length !== groups[2].length) {
      throw new Error(
        `Unbalanced challenge groups: ${groups[1].length} vs ${groups[2].length}`
      )
    }
  }

  const otherChallenge: Challenge = startChallenge === 1 ? 2 : 1
  const start = shuffle(groups[startChallenge], rng)
  const other = shuffle(groups[otherChallenge], rng)

  const cycle: number[] = []
  for (let i = 0; i < Math.max(start.length, other.length); i++) {
    if (i < start.length) cycle.push(start[i])
    if (i < other.length) cycle.push(other[i])
  }
  return cycle
}

/** Returns a draw function yielding segment indices that strictly alternate challenges. */
export function useAlternatingDraw(segments: readonly Segment[]): () => number {
  const queueRef = useRef<number[]>([])
  const startRef = useRef<Challenge | null>(null)

  return useCallback(() => {
    if (startRef.current === null) {
      startRef.current = Math.random() < 0.5 ? 1 : 2
    }
    if (queueRef.current.length === 0) {
      queueRef.current = buildCycle(segments, startRef.current)
    }
    return queueRef.current.shift()!
  }, [segments])
}
