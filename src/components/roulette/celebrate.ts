import confetti from "canvas-confetti"
import { CONFETTI_COLORS } from "./segments"

const BURST_INTERVAL_MS = 280

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

/** Fireworks-style confetti bursts from random points. Returns stop(), which also clears the canvas. */
export function celebrate({ durationMs }: { durationMs: number }): () => void {
  const burst = () => {
    void confetti({
      particleCount: Math.floor(randomBetween(40, 80)),
      startVelocity: randomBetween(25, 40),
      spread: 360,
      ticks: 70,
      gravity: 0.9,
      origin: { x: randomBetween(0.1, 0.9), y: randomBetween(0.1, 0.5) },
      colors: CONFETTI_COLORS,
      zIndex: 50,
      disableForReducedMotion: true,
    })
  }

  burst()
  const interval = window.setInterval(burst, BURST_INTERVAL_MS)
  const timeout = window.setTimeout(() => window.clearInterval(interval), durationMs)

  return () => {
    window.clearInterval(interval)
    window.clearTimeout(timeout)
    confetti.reset()
  }
}
