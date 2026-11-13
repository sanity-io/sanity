import {type ImageAspectRatio, type ImageCrop, type ImageCropDimensions} from '@sanity/types'

import {
  nearestAllowedRatio,
  ratioMatchesConstraint,
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

/**
 * The largest centered crop at the allowed ratio nearest the source's own. A source ratio inside a
 * range keeps the whole image. With listed ratios and `minDimensions`, a nearest ratio whose crop
 * is too small gives way to the nearest listed ratio whose crop is large enough, when there is one.
 *
 * @internal
 */
export function defaultCropRect(
  source: ImageCropDimensions,
  constraint: ResolvedImageAspectRatio,
  minDimensions?: ImageCropDimensions,
): ImagePixelRect {
  const sourceRatio = source.width / source.height
  const nearest = largestRectForRatio(source, nearestAllowedRatio(sourceRatio, constraint))
  const holdsMinimum = (rect: ImagePixelRect) =>
    minDimensions === undefined || dimensionsAtLeast(croppedDimensions(rect), minDimensions)
  if (constraint.snapRatios === undefined || holdsMinimum(nearest)) {
    return nearest
  }
  const roomyRatios = constraint.snapRatios.filter((ratio) =>
    holdsMinimum(largestRectForRatio(source, ratio)),
  )
  return roomyRatios.length > 0
    ? largestRectForRatio(
        source,
        nearestAllowedRatio(sourceRatio, {...constraint, snapRatios: roomyRatios}),
      )
    : nearest
}

/**
 * The crop to write when the image asset `ref` is set on a field with `aspectRatio`, at a listed
 * ratio that holds `minDimensions` when one can. `undefined` when the field has no ratio, the
 * asset cannot be cropped, or its ratio already fits.
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
  if (ratioMatchesConstraint(source.width / source.height, constraint)) {
    return undefined
  }
  return pixelRectToCrop(defaultCropRect(source, constraint, minDimensions), source)
}
