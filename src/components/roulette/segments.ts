export type Challenge = 1 | 2
export type Paradigm = "imperativo" | "evento"

export interface Segment {
  label: string
  color: string
  challenge: Challenge
  paradigm: Paradigm
}

export const SEGMENTS: Segment[] = [
  {
    label: "Desafío 1 - Imperativo",
    color: "var(--wheel-seg-1)",
    challenge: 1,
    paradigm: "imperativo",
  },
  {
    label: "Desafío 2 - Imperativo",
    color: "var(--wheel-seg-2)",
    challenge: 2,
    paradigm: "imperativo",
  },
  {
    label: "Desafío 1 - Evento",
    color: "var(--wheel-seg-3)",
    challenge: 1,
    paradigm: "evento",
  },
  {
    label: "Desafío 2 - Evento",
    color: "var(--wheel-seg-4)",
    challenge: 2,
    paradigm: "evento",
  },
]

export const SEGMENT_ANGLE = 360 / SEGMENTS.length

/** Plain hex mirrors of the --wheel-seg-N tokens (canvas cannot read CSS variables). */
export const CONFETTI_COLORS = ["#c2410c", "#dc2626", "#2563eb", "#7c3aed", "#fcd34d"]
