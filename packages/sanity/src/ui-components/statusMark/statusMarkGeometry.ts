import {type BadgeTone} from '@sanity/ui'

/**
 * Every status mark: what a version is (Published, Draft, a release type, an agent bundle, a
 * variant).
 *
 * @internal
 */
export type StatusMarkName =
  | 'published'
  | 'draft'
  | 'undecided'
  | 'asap'
  | 'scheduled'
  | 'agent'
  | 'variant'
  | 'variant-empty'

/**
 * The mark size M for a context: `row` (10px) leads a row or a menu item, `list` (9px) sits in a
 * document list slot, `inline` (8px) sits in a chip, a pill or running text.
 *
 * @internal
 */
export type StatusMarkSize = 'row' | 'list' | 'inline'

/** The mark size M, in px. */
export const STATUS_MARK_SIZES: Record<StatusMarkSize, number> = {row: 10, list: 9, inline: 8}

/**
 * A shape's painted size as a share of M. Equal boxes are not equal optical size: a filled
 * circle covers about 79% of its box and a diamond 50%, so a circle with the diamond's area is
 * 0.8 M across (the square root of 2 over pi).
 */
const SHARES = {diamond: 1, disc: 0.8, ring: 0.8, pictogram: 1} as const

type Shape = keyof typeof SHARES

/** The width of every stroke, in px at any size: strokes do not scale with the mark. */
export const STATUS_MARK_STROKE = 1.2

interface MarkDrawing {
  shape: Shape
  tone: BadgeTone
  /**
   * The longest side of the drawing's geometry, in its 25-unit box, without its stroke. Every
   * drawing is centred on (12.5, 12.5).
   */
  extent: number
  /** The stroke, in px. It adds to the painted size at any scale. */
  stroke: number
}

/**
 * The drawings. Sizes come from the path geometry in `@sanity/icons` 5.2.3 and the variant
 * diamond's drawings (VariantMark's tight boxes: 7.889 units filled, 9.24 outline).
 */
export const STATUS_MARKS: Record<StatusMarkName, MarkDrawing> = {
  // A disc: circle r = 3.5
  'published': {shape: 'disc', tone: 'positive', extent: 7, stroke: 0},
  'undecided': {shape: 'disc', tone: 'neutral', extent: 7, stroke: 0},
  // A ring: circle r = 2.9, measured on its outside edge
  'draft': {shape: 'ring', tone: 'caution', extent: 5.8, stroke: STATUS_MARK_STROKE},
  // The line bolt (x 7–18, y 4–21), clock (4.5–20.5) and sparkle (5–20), not the filled small ones
  'asap': {shape: 'pictogram', tone: 'caution', extent: 17, stroke: STATUS_MARK_STROKE},
  'scheduled': {shape: 'pictogram', tone: 'suggest', extent: 16, stroke: STATUS_MARK_STROKE},
  'agent': {shape: 'pictogram', tone: 'suggest', extent: 15, stroke: STATUS_MARK_STROKE},
  // Tip to tip
  'variant': {shape: 'diamond', tone: 'suggest', extent: 7.889, stroke: 0},
  'variant-empty': {shape: 'diamond', tone: 'suggest', extent: 9.24, stroke: 0.3},
}

/** The space around the painted mark, in px each side, so a stroke's anti-aliasing is not cut. */
const MARGIN = 1

/**
 * How a mark is drawn at a size. No measuring: the painted size is M × share, and the viewBox is
 * cropped so the drawing paints exactly that inside a box of whole pixels.
 *
 * @internal
 */
export function statusMarkGeometry(
  mark: StatusMarkName,
  size: StatusMarkSize,
): {painted: number; box: number; viewBox: string} {
  const {shape, extent, stroke} = STATUS_MARKS[mark]
  const painted = round(STATUS_MARK_SIZES[size] * SHARES[shape])
  const box = Math.ceil(painted) + MARGIN * 2
  // px per unit, so the geometry plus its fixed-width stroke paints `painted`
  const scale = (painted - stroke) / extent
  const side = box / scale
  const origin = 12.5 - side / 2
  return {painted, box, viewBox: [origin, origin, side, side].map(round).join(' ')}
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000
}
