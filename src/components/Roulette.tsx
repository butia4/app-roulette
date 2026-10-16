import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "cn"
import { Volume2, VolumeX } from "lucide-react"
import { Pointer } from "./roulette/Pointer"
import { Wheel } from "./roulette/Wheel"
import { celebrate } from "./roulette/celebrate"
import { SEGMENTS } from "./roulette/segments"
import { createSoundEngine, type SoundEngine } from "./roulette/sound"
import { useAlternatingDraw } from "./roulette/useAlternatingDraw"
import { useSpin } from "./roulette/useSpin"

type Phase = "idle" | "spinning" | "settled"

export function Roulette() {
  const reducedMotion = !!useReducedMotion()
  const [phase, setPhase] = useState<Phase>("idle")
  const [result, setResult] = useState<string | null>(null)
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [muted, setMuted] = useState(false)
  const mutedRef = useRef(false)
  const soundRef = useRef<SoundEngine | null>(null)
  const stopCelebrationRef = useRef<(() => void) | null>(null)
  const drawWinner = useAlternatingDraw(SEGMENTS)
  const { rotation, flick, spin } = useSpin({
    reducedMotion,
    onDivider: () => {
      if (!mutedRef.current) soundRef.current?.tick()
    },
  })

  useEffect(() => {
    soundRef.current = createSoundEngine()
    return () => {
      stopCelebrationRef.current?.()
      stopCelebrationRef.current = null
      soundRef.current?.dispose()
      soundRef.current = null
    }
  }, [])

  const toggleMuted = () => {
    const next = !muted
    mutedRef.current = next
    setMuted(next)
  }
  const spinning = phase === "spinning"

  const handleSpin = async () => {
    if (spinning) return

    // Create/resume audio inside the click gesture (autoplay policy).
    void soundRef.current?.unlock()
    stopCelebrationRef.current?.()
    stopCelebrationRef.current = null

    const drawnIndex = drawWinner()
    setPhase("spinning")
    setResult(null)
    setWinnerIndex(null)

    const outcome = await spin(drawnIndex)
    if (outcome !== "done") return

    setPhase("settled")
    setResult(SEGMENTS[drawnIndex].label)
    setWinnerIndex(drawnIndex)
    if (!mutedRef.current) soundRef.current?.win()
    if (!reducedMotion) stopCelebrationRef.current = celebrate({ durationMs: 2500 })
  }

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-10 bg-gradient-to-b from-background to-muted p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">¡A Jugar! Girá la Ruleta</h1>
        <p className="text-muted-foreground">Tocá la ruleta para elegir tu desafío</p>
      </div>

      <div className="relative size-[min(80vw,60dvh,24rem)]">
        <Pointer flick={flick} />

        <button
          type="button"
          onClick={handleSpin}
          aria-disabled={spinning}
          aria-label="Girar la ruleta"
          className={cn(
            "relative size-full rounded-full",
            "transition-shadow aria-disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
            !spinning &&
              "cursor-pointer animate-[wheel-glow_2.2s_ease-in-out_infinite] hover:shadow-[0_0_40px_var(--color-primary)]"
          )}
        >
          <motion.div className="size-full" style={{ rotate: rotation }}>
            <Wheel segments={SEGMENTS} winnerIndex={winnerIndex} spinning={spinning} />
          </motion.div>
        </button>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {result ? `Te tocó: ${result}` : ""}
      </p>

      <div className="flex h-16 items-center justify-center">
        {spinning && (
          <p aria-hidden="true" className="text-lg font-medium text-muted-foreground">
            Girando…
          </p>
        )}
        {phase === "settled" && result && (
          <div
            aria-hidden="true"
            className="animate-in fade-in zoom-in-95 rounded-xl border bg-card px-6 py-3 text-center shadow-lg"
          >
            <p className="text-sm text-muted-foreground">Te tocó:</p>
            <p className="text-xl font-bold text-card-foreground">{result}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggleMuted}
        aria-pressed={muted}
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        {muted ? <VolumeX aria-hidden="true" className="size-4" /> : <Volume2 aria-hidden="true" className="size-4" />}
        {muted ? "Activar sonido" : "Silenciar"}
      </button>
    </div>
  )
}
