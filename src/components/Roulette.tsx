import { useCallback, useRef, useState } from "react"
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

export function Roulette() {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
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
    }, SPIN_DURATION_MS)
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-10 bg-gradient-to-b from-background to-muted p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Ruleta de desafíos</h1>
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
            !spinning && "cursor-pointer hover:shadow-[0_0_40px_var(--color-primary)]"
          )}
          style={{
            background: wheelGradient,
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.89, 0.35, 1)`,
          }}
        >
          {SEGMENTS.map((segment, i) => {
            const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
            return (
              <div
                key={segment.label}
                className="absolute inset-0"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <span
                  className="absolute left-1/2 top-[12%] w-[68%] -translate-x-1/2 text-center text-xs font-semibold text-white drop-shadow-md sm:text-sm"
                  style={{ transform: `rotate(${-angle}deg)` }}
                >
                  {segment.label}
                </span>
              </div>
            )
          })}

          <div className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-inner">
            <Dices className="size-7 text-foreground" />
          </div>
        </button>
      </div>

      <div className="flex h-16 items-center justify-center">
        {spinning && (
          <p className="text-lg font-medium text-muted-foreground">Girando…</p>
        )}
        {!spinning && result && (
          <div className="animate-in fade-in zoom-in-95 rounded-xl border bg-card px-6 py-3 text-center shadow-lg">
            <p className="text-sm text-muted-foreground">Te tocó:</p>
            <p className="text-xl font-bold text-card-foreground">{result}</p>
          </div>
        )}
      </div>
    </div>
  )
}
