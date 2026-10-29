import {type ImageAspectRatio, type ImageCrop, type ImageCropDimensions} from '@sanity/types'

import {
  clampRatio,
  nearestRatio,
  ratioMatchesConstraint,
  resolveAspectRatio,
  type ResolvedImageAspectRatio,
} from './aspectRatio'
import {getImageRefDimensions, type ImagePixelRect, pixelRectToCrop} from './cropDimensions'

/**
 * The largest rectangle at `ratio` that fits inside `source`, centered.
 *
 * @internal
 */
export function largestRectForRatio(source: ImageCropDimensions, ratio: number): ImagePixelRect {
  const width = Math.min(source.width, source.height * ratio)
  const height = width / ratio
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
  {range, snapRatios}: ResolvedImageAspectRatio,
): ImagePixelRect {
  const sourceRatio = source.width / source.height
  const ratio = snapRatios ? nearestRatio(sourceRatio, snapRatios) : clampRatio(sourceRatio, range)
  return largestRectForRatio(source, ratio)
}

/**
 * The crop to write when the image asset `ref` is set on a field with `aspectRatio`. `undefined`
 * when the field has no ratio, the asset cannot be cropped, or its ratio already fits.
 *
 * @internal
 */
export function getDefaultImageCrop(
  ref: string,
  aspectRatio: ImageAspectRatio | undefined,
): ImageCrop | undefined {
  const source = getImageRefDimensions(ref)
  if (aspectRatio === undefined || source === undefined) {
    return undefined
  }
  const constraint = resolveAspectRatio(aspectRatio)
  if (ratioMatchesConstraint(source.width / source.height, constraint)) {
    return undefined
  }
  return pixelRectToCrop(defaultCropRect(source, constraint), source)
}
