import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "cn"
import { Pointer } from "./roulette/Pointer"
import { Wheel } from "./roulette/Wheel"
import { SEGMENTS } from "./roulette/segments"
import { useEquitableDraw } from "./roulette/useEquitableDraw"
import { useSpin } from "./roulette/useSpin"

type Phase = "idle" | "spinning" | "settled"

const FIREWORK_COLORS = ["#f97316", "#facc15", "#22c55e", "#3b82f6", "#ec4899", "#a855f7", "#ef4444"]

function makeFirework(id: number | string, originX: number, peakHeight: number) {
  const rocketDrift = (Math.random() - 0.5) * 24
  const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]
  // Taller launches take longer to arrive, like a real rocket at roughly constant speed.
  const launchDuration = 0.55 + (peakHeight / 100) * 0.75
  const launchDelay = Math.random() * 0.2
  const particleCount = 26 + Math.floor(Math.random() * 14)

  const particles = Array.from({ length: particleCount }, (_, p) => {
    const angle = (p / particleCount) * Math.PI * 2 + Math.random() * 0.25
    const distance = 70 + Math.random() * 120
    return {
      id: p,
      px: Math.cos(angle) * distance,
      py: Math.sin(angle) * distance,
      duration: 0.9 + Math.random() * 0.6,
    }
  })

  return { id, originX, peakHeight, rocketDrift, color, launchDuration, launchDelay, particles }
}

function FireworksShow({ burstId }: { burstId: number }) {
  const fireworks = useMemo(() => {
    const sideCount = 42
    const half = sideCount / 2
    const sideFireworks = Array.from({ length: sideCount }, (_, i) => {
      // Leave a gap around the wheel (35%-65%) and bias the rest toward the
      // outer edges: sqrt() spreads density outward within each side.
      const side = i < half ? -1 : 1
      const within = side === -1 ? i : i - half
      const eased = Math.sqrt(within / (half - 1))
      const originX =
        (side === -1 ? 35 - eased * 31 : 65 + eased * 31) + (Math.random() - 0.5) * 4
      const peakHeight = 38 + Math.random() * 62
      return makeFirework(i, originX, peakHeight)
    })

    // A separate wave that explodes high above the wheel, spread across the
    // full width including the center, so the top of the screen fills up too.
    const topCount = 16
    const topFireworks = Array.from({ length: topCount }, (_, i) => {
      const originX = 12 + Math.random() * 76
      const peakHeight = 80 + Math.random() * 22
      return makeFirework(`top-${i}`, originX, peakHeight)
    })

    return [...sideFireworks, ...topFireworks]
  }, [burstId])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {fireworks.map((fw) => (
        <div key={fw.id}>
          <span
            className="absolute bottom-0 w-[3px] -translate-x-1/2 rounded-full"
            style={{
              left: `${fw.originX}%`,
              height: 26,
              background: `linear-gradient(to top, transparent, ${fw.color})`,
              boxShadow: `0 -2px 8px 2px ${fw.color}`,
              animation: `firework-rocket ${fw.launchDuration}s cubic-bezier(0.3, 0.6, 0.7, 1) ${fw.launchDelay}s forwards`,
              ["--rx" as string]: `${fw.rocketDrift}px`,
              ["--ry" as string]: `-${fw.peakHeight}vh`,
            }}
          />

          <div
            className="absolute -translate-x-1/2"
            style={{ left: `calc(${fw.originX}% + ${fw.rocketDrift}px)`, bottom: `${fw.peakHeight}vh` }}
          >
            <span
              className="absolute left-0 top-0 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
              style={{
                background: `radial-gradient(circle, ${fw.color}cc 0%, transparent 70%)`,
                animation: `firework-flash 0.45s ease-out ${fw.launchDelay + fw.launchDuration}s forwards`,
              }}
            />
            {fw.particles.map((p) => (
              <span
                key={p.id}
                className="absolute left-0 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
                style={{
                  backgroundColor: fw.color,
                  boxShadow: `0 0 6px 1px ${fw.color}`,
                  animation: `firework-particle ${p.duration}s ease-out ${fw.launchDelay + fw.launchDuration}s forwards`,
                  ["--px" as string]: `${p.px}px`,
                  ["--py" as string]: `${p.py}px`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Roulette() {
  const reducedMotion = !!useReducedMotion()
  const [phase, setPhase] = useState<Phase>("idle")
  const [result, setResult] = useState<string | null>(null)
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [burstId, setBurstId] = useState(0)
  const drawWinner = useEquitableDraw(SEGMENTS.length)
  const { rotation, flick, spin } = useSpin({ reducedMotion, onDivider: () => {} })
  const spinning = phase === "spinning"

  const handleSpin = async () => {
    if (spinning) return

    const drawnIndex = drawWinner()
    setPhase("spinning")
    setResult(null)
    setWinnerIndex(null)

    const outcome = await spin(drawnIndex)
    if (outcome !== "done") return

    setPhase("settled")
    setResult(SEGMENTS[drawnIndex].label)
    setWinnerIndex(drawnIndex)
    setBurstId((id) => id + 1)
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
          <>
            {!reducedMotion && <FireworksShow burstId={burstId} />}
            <div
              aria-hidden="true"
              className="animate-in fade-in zoom-in-95 rounded-xl border bg-card px-6 py-3 text-center shadow-lg"
            >
              <p className="text-sm text-muted-foreground">Te tocó:</p>
              <p className="text-xl font-bold text-card-foreground">{result}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
