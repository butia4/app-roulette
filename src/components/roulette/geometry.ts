/** Point at `angle` degrees clockwise from the top, at distance `r` from (cx, cy). */
export function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle * Math.PI) / 180
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
}

/** SVG path of a pie slice from `startAngle` to `endAngle` (degrees, clockwise from top). */
export function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polar(cx, cy, r, startAngle)
  const end = polar(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
}

/**
 * Final rotation that leaves the pointer inside the winner segment's safe zone
 * (at most +/-35% of the segment width from its center).
 * `u` in [-1, 1] picks the offset inside the safe zone.
 */
export function computeTarget(
  currentRotation: number,
  winnerIndex: number,
  segmentCount: number,
  turns: number,
  u: number
) {
  const segmentAngle = 360 / segmentCount
  const landing = winnerIndex * segmentAngle + segmentAngle / 2 + u * 0.35 * segmentAngle
  const currentMod = ((currentRotation % 360) + 360) % 360
  const delta = (((360 - landing - currentMod) % 360) + 360) % 360
  return currentRotation + turns * 360 + delta
}

/** Number of dividers the wheel has swept past at rotation `rotation`. */
export function dividerCount(rotation: number, segmentAngle: number) {
  return Math.floor(rotation / segmentAngle)
}
