import { arcPath, polar } from "./geometry"
import type { Segment } from "./segments"

interface WheelProps {
  segments: Segment[]
  winnerIndex: number | null
  spinning: boolean
}

const CENTER = 100
const RIM_RADIUS = 98
const SEGMENT_RADIUS = 88
const HUB_RADIUS = 18
const LABEL_RADIUS = 55

export function Wheel({ segments, winnerIndex, spinning }: WheelProps) {
  const count = segments.length
  const segmentAngle = 360 / count
  const lightCount = count * 3
  const hasWinner = winnerIndex !== null && !spinning

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className="size-full overflow-visible"
      style={{ filter: "drop-shadow(0 8px 12px rgb(0 0 0 / 0.35))" }}
    >
      <circle cx={CENTER} cy={CENTER} r={RIM_RADIUS} style={{ fill: "var(--wheel-rim)" }} />

      {segments.map((segment, i) => {
        const isWinner = hasWinner && i === winnerIndex
        return (
          <path
            key={segment.label}
            d={arcPath(CENTER, CENTER, SEGMENT_RADIUS, i * segmentAngle, (i + 1) * segmentAngle)}
            style={{
              fill: segment.color,
              opacity: hasWinner && !isWinner ? 0.45 : 1,
              stroke: isWinner ? "var(--wheel-light)" : "none",
              strokeWidth: isWinner ? 4 : 0,
              strokeLinejoin: "round",
              transition: "opacity 300ms",
            }}
          />
        )
      })}

      {segments.map((segment, i) => {
        const end = polar(CENTER, CENTER, SEGMENT_RADIUS, i * segmentAngle)
        return (
          <line
            key={`divider-${segment.label}`}
            x1={CENTER}
            y1={CENTER}
            x2={end.x}
            y2={end.y}
            strokeWidth={1.5}
            style={{ stroke: "var(--wheel-divider)" }}
          />
        )
      })}

      {segments.map((segment, i) => {
        // Radial label: on the left half the text is flipped 180 degrees so it stays upright.
        const mid = i * segmentAngle + segmentAngle / 2
        const flipped = mid > 180
        const rotation = flipped ? mid + 90 : mid - 90
        const x = flipped ? -LABEL_RADIUS : LABEL_RADIUS
        const [title, subtitle] = segment.label.split(" - ")
        return (
          <text
            key={`label-${segment.label}`}
            transform={`translate(${CENTER} ${CENTER}) rotate(${rotation})`}
            textAnchor="middle"
            fontSize={8}
            fontWeight={700}
            style={{ fill: "var(--wheel-label)" }}
          >
            <tspan x={x} y={subtitle ? -1 : 3}>
              {title}
            </tspan>
            {subtitle && (
              <tspan x={x} y={9} fontWeight={500} fontSize={7.5}>
                {subtitle}
              </tspan>
            )}
          </text>
        )
      })}

      {Array.from({ length: lightCount }, (_, i) => {
        const p = polar(CENTER, CENTER, (RIM_RADIUS + SEGMENT_RADIUS) / 2, (i * 360) / lightCount)
        return <circle key={i} cx={p.x} cy={p.y} r={2} style={{ fill: "var(--wheel-light)" }} />
      })}

      <circle
        cx={CENTER}
        cy={CENTER}
        r={HUB_RADIUS}
        strokeWidth={2}
        style={{ fill: "var(--wheel-hub)", stroke: "var(--wheel-rim)" }}
      />
      <text
        x={CENTER}
        y={CENTER + 3}
        textAnchor="middle"
        fontSize={8}
        fontWeight={700}
        letterSpacing={0.5}
        style={{ fill: "var(--foreground)" }}
      >
        GIRAR
      </text>
    </svg>
  )
}
