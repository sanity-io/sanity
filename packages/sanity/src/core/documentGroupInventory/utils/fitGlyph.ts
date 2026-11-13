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
 * The scale each glyph needs, by {@link glyphKey}. A glyph's painted share of its box is fixed by its
 * paths and `viewBox`, and the inventory renders every leading icon at the same size, so the scale is
 * measured once per glyph and size, for the session, and every later row only writes it.
 */
const scaleCache = new Map<string, number>()

/**
 * What identifies a glyph's geometry: its icon name and `viewBox` (the variant diamond is one icon
 * drawn in two crops), at a target size. `undefined` for an svg without a name, which is measured
 * whenever its node changes.
 *
 * @internal
 */
export function glyphKey(svg: SVGSVGElement, size: number): string | undefined {
  const name = svg.getAttribute('data-sanity-icon')
  return name ? `${name}|${svg.getAttribute('viewBox')}|${size}` : undefined
}

/**
 * Forgets the measured scales. For tests.
 *
 * @internal
 */
export function clearGlyphScaleCache(): void {
  scaleCache.clear()
}

/**
 * Scales an icon so its glyph paints `size` px, whatever the margin its `viewBox` leaves. Uses the
 * CSS `scale` property, which does not move the layout box: the glyph stays centred where it was.
 *
 * A glyph seen before only gets the cached scale written, with no layout read. Only the first of
 * each glyph is measured, which reads layout once. Returns whether the glyph got a scale; it does not
 * while it is hidden.
 *
 * @internal
 */
export function fitGlyph(svg: SVGSVGElement, size: number): boolean {
  const key = glyphKey(svg, size)
  const cached = key === undefined ? undefined : scaleCache.get(key)
  if (cached !== undefined) {
    svg.style.setProperty('scale', String(cached))
    return true
  }

  svg.style.removeProperty('scale')
  const viewBoxWidth = svg.viewBox.baseVal?.width
  const width = svg.getBoundingClientRect().width
  // Not laid out (hidden): leave it, and measure the next time it renders
  if (!viewBoxWidth || !width) return false

  let units: number | undefined
  try {
    units = paintedUnits(svg)
  } catch {
    // Firefox throws from `getBBox()` on a glyph that is not rendered
    return false
  }
  const scale = glyphScale(((units ?? 0) * width) / viewBoxWidth, size)
  if (scale === undefined) return false
  if (key !== undefined) scaleCache.set(key, scale)
  svg.style.setProperty('scale', String(scale))
  return true
}
