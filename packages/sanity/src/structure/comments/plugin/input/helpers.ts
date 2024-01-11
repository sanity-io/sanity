/**
 * A function that creates a DOMRect from an array of elements.
 */
export function createDomRectFromElements(elements: Element[]): DOMRect | null {
  if (!elements || !elements.length) return null

  const rects = elements.map((el) => el.getBoundingClientRect())

  const minX = Math.min(...rects.map((r) => r.x))
  const minY = Math.min(...rects.map((r) => r.y))
  const maxRight = Math.max(...rects.map((r) => r.right))
  const maxBottom = Math.max(...rects.map((r) => r.bottom))

  return {
    x: minX,
    y: minY,
    width: maxRight - minX,
    height: maxBottom - minY,
    top: minY,
    right: maxRight,
    bottom: maxBottom,
    left: minX,
  } as DOMRect
}
