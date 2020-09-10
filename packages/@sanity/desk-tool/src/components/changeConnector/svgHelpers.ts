export interface Point {
  top: number
  left: number
}

export const moveTo = (from: number, to: number) => `M${from},${to}`
export const lineTo = (from: number, to: number) => `L${from},${to}`

const quadraticBezierPath = (
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number
  // eslint-disable-next-line max-params
) => `M${p1x},${p1y}Q${p2x},${p2y} ${p3x},${p3y}`

export const linePath = (p1x: number, p1y: number, p2x: number, p2y: number) =>
  `M${p1x},${p1y}L${p2x},${p2y}`

export const linePathFromPoints = (p1: Point, p2: Point) =>
  `M${p1.left},${p1.top}L${p2.left},${p2.top}`

export const connectorLinePath = (
  from: Point,
  to: Point,
  cornerRadius: number,
  midLeft = from.left + (to.left - from.left) / 2
) => {
  const halfHeight = (to.top - from.top) / 2

  // left position of the begin (left) arc
  const beginArcLeft = Math.max(from.left, midLeft - cornerRadius)

  // left position of the end (right) arc
  const endArcLeft = Math.min(to.left, midLeft + cornerRadius)

  const maxTop = Math.max(from.top - cornerRadius, from.top + Math.min(halfHeight, cornerRadius))

  const minTop = Math.min(to.top + cornerRadius, to.top - Math.min(halfHeight, cornerRadius))

  // path of the line connecting the leftmost point with the begin arc
  const beginLine = linePath(from.left, from.top, beginArcLeft, from.top)

  // path of the begin arc
  const beginArc = quadraticBezierPath(beginArcLeft, from.top, midLeft, from.top, midLeft, maxTop)

  // path of the vertical line in the middle
  const midVerticalLine = linePath(midLeft, maxTop, midLeft, minTop)

  // path of the end arc
  const endArc = quadraticBezierPath(endArcLeft, to.top, midLeft, to.top, midLeft, minTop)

  // path of the line connecting the rightmost point with the second arc
  const endLine = linePath(to.left, to.top, endArcLeft, to.top)

  return beginLine + beginArc + midVerticalLine + endArc + endLine
}
