import {type ImageCropDimensions} from '@sanity/types'

import {nearestAllowedRatio, type ResolvedImageAspectRatio} from './aspectRatio'
import {type ImagePixelRect} from './cropDimensions'

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
 * range keeps the whole image.
 *
 * @internal
 */
export function defaultCropRect(
  source: ImageCropDimensions,
  constraint: ResolvedImageAspectRatio,
): ImagePixelRect {
  return largestRectForRatio(source, nearestAllowedRatio(source.width / source.height, constraint))
}
