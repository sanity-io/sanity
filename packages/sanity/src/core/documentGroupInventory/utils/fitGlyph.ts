const SHAPES = 'path, circle, ellipse, rect, line, polyline, polygon'

interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * The union of boxes, or `undefined` for none.
 *
 * @internal
 */
export function unionBoxes(boxes: Box[]): Box | undefined {
  if (boxes.length === 0) return undefined
  return boxes.reduce((a, b) => ({
    left: Math.min(a.left, b.left),
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
  }))
}

/**
 * The scale that makes a glyph painting `painted` px paint `target` px, or `undefined` when the
 * glyph paints nothing (it is hidden, or has not been laid out).
 *
 * @internal
 */
export function glyphScale(painted: number, target: number): number | undefined {
  if (!Number.isFinite(painted) || painted <= 0) return undefined
  return target / painted
}

/**
 * How big an icon's glyph paints, in the svg's own units: the larger side of the box around every
 * shape, strokes included. An icon's `viewBox` leaves a different margin around each glyph (a
 * release dot paints a fifth of its box, a clock two thirds), so the svg's own size says nothing
 * about how big the glyph looks.
 */
function paintedUnits(svg: SVGSVGElement): number | undefined {
  const boxes: Box[] = []
  for (const shape of svg.querySelectorAll<SVGGraphicsElement>(SHAPES)) {
    const {x, y, width, height} = shape.getBBox()
    const style = getComputedStyle(shape)
    const stroke = style.stroke === 'none' ? 0 : Number.parseFloat(style.strokeWidth) || 0
    boxes.push({
      left: x - stroke / 2,
      top: y - stroke / 2,
      right: x + width + stroke / 2,
      bottom: y + height + stroke / 2,
    })
  }
  const box = unionBoxes(boxes)
  return box && Math.max(box.right - box.left, box.bottom - box.top)
}

/**
 * Scales an icon so its glyph paints `size` px, whatever the margin its `viewBox` leaves. Uses the
 * CSS `scale` property, which does not move the layout box: the glyph stays centred where it was.
 *
 * @internal
 */
export function fitGlyph(svg: SVGSVGElement, size: number): void {
  svg.style.removeProperty('scale')
  const viewBoxWidth = svg.viewBox.baseVal?.width
  const width = svg.getBoundingClientRect().width
  if (!viewBoxWidth || !width) return

  let units: number | undefined
  try {
    units = paintedUnits(svg)
  } catch {
    // Firefox throws from `getBBox()` on a glyph that is not rendered
    return
  }
  const scale = glyphScale(((units ?? 0) * width) / viewBoxWidth, size)
  if (scale !== undefined) svg.style.setProperty('scale', String(scale))
}
