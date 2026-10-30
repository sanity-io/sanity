import {
  type ImageAspectRatio,
  type ImageAspectRatioRange,
  type ImageCropDimensions,
} from '@sanity/types'

/**
 * An authored {@link ImageAspectRatio} resolved into the range the crop must stay within, plus the
 * ratios the crop snaps to when the field lists them.
 *
 * @internal
 */
export interface ResolvedImageAspectRatio {
  range: ImageAspectRatioRange
  snapRatios?: number[]
}

// Slack on the ratio itself; rounding to whole pixels is handled separately.
const RATIO_MATCH_TOLERANCE = 0.01

const HALF_PIXEL = 0.5

// Keeps 2.35 from rendering as 47:20.
const MAX_LABEL_DENOMINATOR = 16

const LABEL_DENOMINATORS = Array.from({length: MAX_LABEL_DENOMINATOR}, (_value, index) => index + 1)

/** @internal */
export function clampRatio(ratio: number, range: ImageAspectRatioRange): number {
  return Math.min(Math.max(ratio, range.min), range.max)
}

/**
 * The member of `ratios` closest to `ratio`. `ratios` must not be empty.
 *
 * @internal
 */
export function nearestRatio(ratio: number, ratios: number[]): number {
  return ratios.reduce((best, candidate) =>
    Math.abs(candidate - ratio) < Math.abs(best - ratio) ? candidate : best,
  )
}

/**
 * Resolves an authored aspect ratio. A number becomes a range with equal bounds, a range passes
 * through, and an array becomes the range between its extremes with its sorted, de-duplicated
 * members as `snapRatios`.
 *
 * @internal
 */
export function resolveAspectRatio(aspectRatio: ImageAspectRatio): ResolvedImageAspectRatio {
  if (typeof aspectRatio === 'number') {
    return {range: {min: aspectRatio, max: aspectRatio}}
  }
  if (Array.isArray(aspectRatio)) {
    const snapRatios = [...new Set(aspectRatio)].toSorted((left, right) => left - right)
    return {range: {min: snapRatios[0], max: snapRatios[snapRatios.length - 1]}, snapRatios}
  }
  return {range: {min: aspectRatio.min, max: aspectRatio.max}}
}

/**
 * The ratio the constraint allows that is closest to `ratio`: the nearest listed ratio, the ratio
 * clamped to the range, or `ratio` itself without a constraint.
 *
 * @internal
 */
export function nearestAllowedRatio(
  ratio: number,
  constraint: ResolvedImageAspectRatio | undefined,
): number {
  if (constraint === undefined) {
    return ratio
  }
  return constraint.snapRatios
    ? nearestRatio(ratio, constraint.snapRatios)
    : clampRatio(ratio, constraint.range)
}

/**
 * Whether `ratio` satisfies a resolved constraint within a relative tolerance. A snap list
 * matches its nearest member, and a range matches anything inside it.
 *
 * @internal
 */
export function ratioMatchesConstraint(
  ratio: number,
  constraint: ResolvedImageAspectRatio,
  tolerance = RATIO_MATCH_TOLERANCE,
): boolean {
  const target = nearestAllowedRatio(ratio, constraint)
  return Math.abs(ratio - target) <= target * tolerance
}

/**
 * Whether a whole-pixel size could have come from a size within half a pixel per axis whose ratio
 * satisfies the constraint, so rounding a small crop to pixels never fails it.
 *
 * @internal
 */
export function dimensionsMatchConstraint(
  {width, height}: ImageCropDimensions,
  {range, snapRatios}: ResolvedImageAspectRatio,
  tolerance = RATIO_MATCH_TOLERANCE,
): boolean {
  const narrowest = (width - HALF_PIXEL) / (height + HALF_PIXEL)
  const widest = (width + HALF_PIXEL) / (height - HALF_PIXEL)
  const allowed = snapRatios ? snapRatios.map((ratio) => ({min: ratio, max: ratio})) : [range]
  return allowed.some(
    ({min, max}) => narrowest <= max * (1 + tolerance) && widest >= min * (1 - tolerance),
  )
}

/**
 * Formats a ratio as a `width:height` label with a small denominator (`16:9`), falling back to a
 * decimal (`2.35:1`) when no small pair is close enough.
 *
 * @internal
 */
export function formatAspectRatio(ratio: number): string {
  const denominator = LABEL_DENOMINATORS.find((height) => {
    const width = ratio * height
    const rounded = Math.round(width)
    return rounded >= 1 && Math.abs(width - rounded) < 0.02
  })
  return denominator ? `${Math.round(ratio * denominator)}:${denominator}` : `${ratio.toFixed(2)}:1`
}

/**
 * Describes a resolved constraint: `16:9`, `between 4:3 and 16:9`, or `1:1, 4:3 or 16:9`.
 *
 * @internal
 */
export function describeAspectRatio({range, snapRatios}: ResolvedImageAspectRatio): string {
  if (snapRatios && snapRatios.length > 1) {
    const labels = snapRatios.map(formatAspectRatio)
    return `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}`
  }
  if (range.min === range.max) {
    return formatAspectRatio(range.min)
  }
  return `between ${formatAspectRatio(range.min)} and ${formatAspectRatio(range.max)}`
}
