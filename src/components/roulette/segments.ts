export interface Segment {
  label: string
  color: string
}

export const SEGMENTS: Segment[] = [
  { label: "Desafío 1 - Imperativo", color: "var(--wheel-seg-1)" },
  { label: "Desafío 2 - Imperativo", color: "var(--wheel-seg-2)" },
  { label: "Desafío 1 - Evento", color: "var(--wheel-seg-3)" },
  { label: "Desafío 2 - Evento", color: "var(--wheel-seg-4)" },
]

export const SEGMENT_ANGLE = 360 / SEGMENTS.length

/** Plain hex mirrors of the --wheel-seg-N tokens (canvas cannot read CSS variables). */
export const CONFETTI_COLORS = ["#c2410c", "#dc2626", "#2563eb", "#7c3aed", "#fcd34d"]
