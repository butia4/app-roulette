import { useCallback, useMemo, useRef, useState } from "react"
import { Dices } from "lucide-react"
import { cn } from "cn"

interface Segment {
  label: string
  color: string
}

const SEGMENTS: Segment[] = [
  { label: "Desafío 1 - Imperativo", color: "#f97316" },
  { label: "Desafío 2 - Imperativo", color: "#ef4444" },
  { label: "Desafío 1 - Evento", color: "#3b82f6" },
  { label: "Desafío 2 - Evento", color: "#8b5cf6" },
]

const SEGMENT_ANGLE = 360 / SEGMENTS.length
const SPIN_DURATION_MS = 4200
const EXTRA_SPINS = 5

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
function useEquitableDraw(optionCount: number) {
  const bagRef = useRef<number[]>([])

  return useCallback(() => {
    if (bagRef.current.length === 0) {
      bagRef.current = shuffle(Array.from({ length: optionCount }, (_, i) => i))
    }
    return bagRef.current.pop()!
  }, [optionCount])
}

const wheelGradient = `conic-gradient(${SEGMENTS.map((segment, i) => {
  const start = i * SEGMENT_ANGLE
  const end = start + SEGMENT_ANGLE
  return `${segment.color} ${start}deg ${end}deg`
}).join(", ")})`

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
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [burstId, setBurstId] = useState(0)
  const rotationRef = useRef(0)
  const drawWinner = useEquitableDraw(SEGMENTS.length)
  const timeoutRef = useRef<number | null>(null)

  const handleSpin = () => {
    if (spinning) return

    const winnerIndex = drawWinner()
    const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6)
    const targetAngleFromTop = winnerIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 + jitter

    const currentMod = ((rotationRef.current % 360) + 360) % 360
    const desiredMod = ((360 - targetAngleFromTop) % 360 + 360) % 360
    let deltaToDesired = desiredMod - currentMod
    if (deltaToDesired < 0) deltaToDesired += 360

    rotationRef.current += EXTRA_SPINS * 360 + deltaToDesired
    setRotation(rotationRef.current)
    setSpinning(true)
    setResult(null)

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setSpinning(false)
      setResult(SEGMENTS[winnerIndex].label)
      setBurstId((id) => id + 1)
    }, SPIN_DURATION_MS)
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-10 bg-gradient-to-b from-background to-muted p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">¡A Jugar! Girá la Ruleta</h1>
        <p className="text-muted-foreground">Tocá la ruleta para elegir tu desafío</p>
      </div>

      <div className="relative size-80 sm:size-96">
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "16px solid transparent",
            borderRight: "16px solid transparent",
            borderTop: "28px solid var(--foreground)",
          }}
        />

        <button
          type="button"
          onClick={handleSpin}
          disabled={spinning}
          aria-label="Girar la ruleta"
          className={cn(
            "relative size-full rounded-full border-4 border-foreground/10 shadow-2xl",
            "transition-shadow disabled:cursor-not-allowed",
            !spinning &&
              "cursor-pointer animate-[wheel-glow_2.2s_ease-in-out_infinite] hover:shadow-[0_0_40px_var(--color-primary)]"
          )}
          style={{
            background: wheelGradient,
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.89, 0.35, 1)`,
          }}
        >
          {SEGMENTS.map((segment, i) => {
            const midAngle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
            const rad = (midAngle * Math.PI) / 180
            const radius = 30
            const x = 50 + radius * Math.sin(rad)
            const y = 50 - radius * Math.cos(rad)
            const [title, subtitle] = segment.label.split(" - ")
            return (
              <div
                key={segment.label}
                className="absolute flex w-[40%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center leading-tight text-white drop-shadow-md"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <span className="text-[11px] font-bold sm:text-sm">{title}</span>
                {subtitle && (
                  <span className="text-[10px] font-medium sm:text-xs">{subtitle}</span>
                )}
              </div>
            )
          })}

          <div className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full bg-background shadow-inner sm:size-20">
            <Dices className="size-5 text-foreground sm:size-6" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-foreground sm:text-xs">
              Girar
            </span>
          </div>
        </button>
      </div>

      <div className="flex h-16 items-center justify-center">
        {spinning && (
          <p className="text-lg font-medium text-muted-foreground">Girando…</p>
        )}
        {!spinning && result && (
          <>
            <FireworksShow burstId={burstId} />
            <div className="animate-in fade-in zoom-in-95 rounded-xl border bg-card px-6 py-3 text-center shadow-lg">
              <p className="text-sm text-muted-foreground">Te tocó:</p>
              <p className="text-xl font-bold text-card-foreground">{result}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
