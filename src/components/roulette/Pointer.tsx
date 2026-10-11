import { motion } from "motion/react"
import type { MotionValue } from "motion/react"

interface PointerProps {
  flick: MotionValue<number>
}

export function Pointer({ flick }: PointerProps) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 32 40"
      className="pointer-events-none absolute left-1/2 top-0 z-10 w-8 -translate-x-1/2 -translate-y-1/3 overflow-visible"
      style={{ rotate: flick, transformOrigin: "50% 15%" }}
    >
      <path
        d="M16 38 L3 8 A14 14 0 1 1 29 8 Z"
        fill="var(--wheel-pointer)"
        style={{ filter: "drop-shadow(0 3px 3px rgb(0 0 0 / 0.45))" }}
      />
      <circle cx="16" cy="12" r="4" fill="var(--wheel-hub)" />
    </motion.svg>
  )
}
