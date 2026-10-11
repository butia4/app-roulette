import { useCallback, useRef } from "react"

function shuffle<T>(items: T[]): T[] {
  const array = [...items]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Equitable draw: indices are dealt from a shuffled bag containing each
 * option exactly once, so every option lands exactly once per 4 spins
 * regardless of draw order.
 */
export function useEquitableDraw(optionCount: number) {
  const bagRef = useRef<number[]>([])

  return useCallback(() => {
    if (bagRef.current.length === 0) {
      bagRef.current = shuffle(Array.from({ length: optionCount }, (_, i) => i))
    }
    return bagRef.current.pop()!
  }, [optionCount])
}
