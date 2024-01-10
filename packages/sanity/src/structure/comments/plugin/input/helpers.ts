export function createDomRectFromElements(elements: Element[]): DOMRect | null {
  if (!elements || !elements.length) return null

  const boundingRects = elements.map((el) => el.getBoundingClientRect())

  const minX = Math.min(...boundingRects.map((r) => r.x))
  const minY = Math.min(...boundingRects.map((r) => r.y))
  const maxRight = Math.max(...boundingRects.map((r) => r.right))
  const maxBottom = Math.max(...boundingRects.map((r) => r.bottom))

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
