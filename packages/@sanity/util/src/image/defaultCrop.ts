import {type ImageAspectRatio, type ImageCrop, type ImageCropDimensions} from '@sanity/types'

import {
  dimensionsMatchConstraint,
  nearestAllowedRatio,
  resolveAspectRatio,
  type ResolvedImageAspectRatio,
} from './aspectRatio'
import {
  croppedDimensions,
  dimensionsAtLeast,
  getImageRefDimensions,
  type ImagePixelRect,
  pixelRectToCrop,
} from './cropDimensions'

/**
 * The largest size at `ratio` that fits inside `bounds`, matching `bounds` exactly on the axis that
 * limits it.
 *
 * @internal
 */
export function largestSizeForRatio(
  bounds: ImageCropDimensions,
  ratio: number,
): ImageCropDimensions {
  return bounds.width / ratio > bounds.height
    ? {width: bounds.height * ratio, height: bounds.height}
    : {width: bounds.width, height: bounds.width / ratio}
}

// A tiny source would otherwise get a crop that rounds to zero pixels.
const MIN_CROP_PIXELS = 1

/**
 * The largest rectangle at `ratio` that fits inside `source`, centered, and at least a pixel on
 * each axis.
 *
 * @internal
 */
export function largestRectForRatio(source: ImageCropDimensions, ratio: number): ImagePixelRect {
  const largest = largestSizeForRatio(source, ratio)
  const width = Math.min(Math.max(largest.width, MIN_CROP_PIXELS), source.width)
  const height = Math.min(Math.max(largest.height, MIN_CROP_PIXELS), source.height)
  return {
    x: (source.width - width) / 2,
    y: (source.height - height) / 2,
    width,
    height,
  }
}

// A clamped ratio pins the crop to the full width or height of `bounds`: the only crop to check.
function fitRatioToMinimum(
  ratio: number,
  constraint: ResolvedImageAspectRatio,
  minimum: ImageCropDimensions,
  bounds: ImageCropDimensions,
): number | undefined {
  const fitted = Math.min(
    Math.max(ratio, minimum.width / bounds.height),
    bounds.width / minimum.height,
  )
  const pinnedCrop = {
    x: 0,
    y: 0,
    width: Math.max(minimum.width, minimum.height * fitted),
    height: Math.max(minimum.height, minimum.width / fitted),
  }
  const accepted =
    fitted === ratio || dimensionsMatchConstraint(croppedDimensions(pinnedCrop), constraint)
  return dimensionsAtLeast(bounds, minimum) && accepted ? fitted : undefined
}

/**
 * The ratio nearest `ratio` at which a crop of at least `minimum` fits inside `bounds` and passes
 * validation. An allowed ratio that cannot hold `minimum` gives way to the nearest ratio inside
 * validation's tolerance that can, then to the nearest listed ratio that can. `undefined` when
 * none can.
 *
 * @internal
 */
export function nearestRatioHoldingMinimum(
  ratio: number,
  constraint: ResolvedImageAspectRatio,
  minimum: ImageCropDimensions,
  bounds: ImageCropDimensions,
): number | undefined {
  const candidates = constraint.snapRatios ?? [nearestAllowedRatio(ratio, constraint)]
  const fittedByCandidate = new Map(
    candidates.flatMap((candidate) => {
      const fitted = fitRatioToMinimum(candidate, constraint, minimum, bounds)
      return fitted === undefined ? [] : [[candidate, fitted] as const]
    }),
  )
  if (fittedByCandidate.size === 0) {
    return undefined
  }
  const nearest = nearestAllowedRatio(ratio, {
    ...constraint,
    snapRatios: [...fittedByCandidate.keys()],
  })
  return fittedByCandidate.get(nearest)
}

/**
 * The largest centered crop at the allowed ratio nearest the source's own. A source ratio inside a
 * range keeps the whole image. With `minDimensions`, the ratio gives way as
 * {@link nearestRatioHoldingMinimum} describes when the source can hold the minimum.
 *
 * @internal
 */
export function defaultCropRect(
  source: ImageCropDimensions,
  constraint: ResolvedImageAspectRatio,
  minDimensions?: ImageCropDimensions,
): ImagePixelRect {
  const sourceRatio = source.width / source.height
  const nearest = nearestAllowedRatio(sourceRatio, constraint)
  const holdingMinimum =
    minDimensions && nearestRatioHoldingMinimum(sourceRatio, constraint, minDimensions, source)
  return largestRectForRatio(source, holdingMinimum ?? nearest)
}

/**
 * The crop to write when the image asset `ref` is set on a field with `aspectRatio`, at a listed
 * ratio that holds `minDimensions` when one can. `undefined` when the field has no ratio, the
 * asset cannot be cropped, or validation already accepts its size.
 *
 * @internal
 */
export function getDefaultImageCrop(
  ref: string,
  aspectRatio: ImageAspectRatio | undefined,
  minDimensions?: ImageCropDimensions,
): ImageCrop | undefined {
  const source = getImageRefDimensions(ref)
  if (aspectRatio === undefined || source === undefined) {
    return undefined
  }
  const constraint = resolveAspectRatio(aspectRatio)
  if (dimensionsMatchConstraint(source, constraint)) {
    return undefined
  }
  return pixelRectToCrop(defaultCropRect(source, constraint, minDimensions), source)
}
