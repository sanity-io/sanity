// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 9748ea43e0, lib/explorations/variants-2-0/mark/hoverIntent.ts).
// Only the imports differ from the original (they point at this monorepo and ./types).
export type Point = {x: number; y: number}

const side = (p: Point, a: Point, b: Point) => (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y)

/**
 * Whether `p` is inside the triangle `apex`, `a`, `b` (edges included). The safe area of a hover
 * popover: `apex` is where the pointer left the control, `a` and `b` are the two corners of the
 * popover edge that faces it.
 */
export function insideTriangle(p: Point, apex: Point, a: Point, b: Point): boolean {
  const d1 = side(p, apex, a)
  const d2 = side(p, a, b)
  const d3 = side(p, b, apex)
  const negative = d1 < 0 || d2 < 0 || d3 < 0
  const positive = d1 > 0 || d2 > 0 || d3 > 0
  return !(negative && positive)
}
