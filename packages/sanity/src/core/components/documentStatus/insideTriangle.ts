/** A point on screen, in viewport coordinates. */
export interface Point {
  x: number
  y: number
}

const side = (p: Point, a: Point, b: Point) => (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y)

/**
 * Whether `p` is inside the triangle `apex`, `a`, `b` (edges included). The safe area of a hover
 * flyout: `apex` is where the pointer left the trigger, `a` and `b` are the two corners of the
 * flyout edge that faces it. Same rule as the document list row's flyout (`hoverIntent.ts` in the
 * structure tool, which core cannot import).
 */
export function insideTriangle(p: Point, apex: Point, a: Point, b: Point): boolean {
  const d1 = side(p, apex, a)
  const d2 = side(p, a, b)
  const d3 = side(p, b, apex)
  const negative = d1 < 0 || d2 < 0 || d3 < 0
  const positive = d1 > 0 || d2 > 0 || d3 > 0
  return !(negative && positive)
}
