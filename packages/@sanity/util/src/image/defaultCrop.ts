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

/**
 * The largest rectangle at `ratio` that fits inside `source`, centered.
 *
 * @internal
 */
export function largestRectForRatio(source: ImageCropDimensions, ratio: number): ImagePixelRect {
  const {width, height} = largestSizeForRatio(source, ratio)
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
