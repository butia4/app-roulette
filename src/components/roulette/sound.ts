export interface SoundEngine {
  /** Create/resume the AudioContext. Call from a user gesture (the spin click). */
  unlock(): Promise<void>
  tick(): void
  win(): void
  dispose(): void
}

const MIN_TICK_GAP_MS = 30

type AudioContextCtor = typeof AudioContext

function getContextCtor(): AudioContextCtor | undefined {
  if (typeof window === "undefined") return undefined
  const w = window as Window & { webkitAudioContext?: AudioContextCtor }
  return window.AudioContext ?? w.webkitAudioContext
}

/** Lazy WebAudio synth. Every method is a silent no-op when audio is unavailable or blocked. */
export function createSoundEngine(): SoundEngine {
  let ctx: AudioContext | null = null
  let lastTick = 0

  const ready = () => (ctx && ctx.state === "running" ? ctx : null)

  const blip = (
    audio: AudioContext,
    freq: number,
    start: number,
    duration: number,
    peak: number,
    type: OscillatorType
  ) => {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain).connect(audio.destination)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  return {
    async unlock() {
      try {
        if (!ctx) {
          const Ctor = getContextCtor()
          if (!Ctor) return
          ctx = new Ctor()
        }
        if (ctx.state === "suspended") await ctx.resume()
      } catch {
        // Audio blocked or unavailable: the app keeps working silently.
      }
    },
    tick() {
      try {
        const audio = ready()
        if (!audio) return
        const now = performance.now()
        if (now - lastTick < MIN_TICK_GAP_MS) return
        lastTick = now
        blip(audio, 1400, audio.currentTime, 0.04, 0.15, "square")
      } catch {
        // ignore
      }
    },
    win() {
      try {
        const audio = ready()
        if (!audio) return
        const t = audio.currentTime
        // C5 E5 G5 C6 arpeggio
        ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          blip(audio, f, t + i * 0.1, 0.35, 0.2, "triangle")
        })
      } catch {
        // ignore
      }
    },
    dispose() {
      const audio = ctx
      ctx = null
      if (audio && audio.state !== "closed") audio.close().catch(() => {})
    },
  }
}
