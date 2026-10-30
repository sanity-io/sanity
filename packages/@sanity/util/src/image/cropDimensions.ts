import {isImageAssetId, parseImageAssetId, type SanityImageAssetIdParts} from '@sanity/asset-utils'
import {type ImageCrop, type ImageCropDimensions, type ImageValue} from '@sanity/types'

/**
 * A crop rectangle in source image pixels, with `(0, 0)` at the top left.
 *
 * @internal
 */
export interface ImagePixelRect {
  x: number
  y: number
  width: number
  height: number
}

function parseImageRef(ref: string | undefined): SanityImageAssetIdParts | undefined {
  try {
    return typeof ref === 'string' && isImageAssetId(ref) ? parseImageAssetId(ref) : undefined
  } catch {
    // A well-formed ID with a zero width or height still throws
    return undefined
  }
}

/**
 * Whether an asset reference is an SVG image (`image-<hash>-<w>x<h>-svg`). The image API does not
 * transform SVGs, so they cannot be cropped.
 *
 * @internal
 */
export function isSvgImageRef(ref: string | undefined): boolean {
  return parseImageRef(ref)?.extension === 'svg'
}

/**
 * The source size encoded in a raster image asset reference (`image-<hash>-<w>x<h>-<format>`), or
 * `undefined` for an SVG or a reference that is not a valid image asset ID.
 *
 * @internal
 */
export function getImageRefDimensions(ref: string | undefined): ImageCropDimensions | undefined {
  const parts = parseImageRef(ref)
  if (parts === undefined || parts.extension === 'svg') {
    return undefined
  }
  return {width: parts.width, height: parts.height}
}

/**
 * Whether an asset reference is a raster image with encoded dimensions, which is what cropping
 * needs.
 *
 * @internal
 */
export function isCroppableImageRef(ref: string | undefined): boolean {
  return Boolean(getImageRefDimensions(ref))
}

/**
 * Converts Sanity's fractional crop insets into a pixel rectangle.
 *
 * @internal
 */
export function cropToPixelRect(crop: ImageCrop, source: ImageCropDimensions): ImagePixelRect {
  return {
    x: crop.left * source.width,
    y: crop.top * source.height,
    width: (1 - crop.left - crop.right) * source.width,
    height: (1 - crop.top - crop.bottom) * source.height,
  }
}

/**
 * Converts a pixel rectangle into Sanity's fractional crop insets.
 *
 * @internal
 */
export function pixelRectToCrop(rect: ImagePixelRect, source: ImageCropDimensions): ImageCrop {
  return {
    _type: 'sanity.imageCrop',
    top: Math.max(0, rect.y / source.height),
    left: Math.max(0, rect.x / source.width),
    right: Math.max(0, (source.width - rect.x - rect.width) / source.width),
    bottom: Math.max(0, (source.height - rect.y - rect.height) / source.height),
  }
}

/**
 * A rectangle's size, rounded to whole pixels.
 *
 * @internal
 */
export function croppedDimensions(rect: ImagePixelRect): ImageCropDimensions {
  return {width: Math.round(rect.width), height: Math.round(rect.height)}
}

/**
 * Whether `dimensions` reach `threshold` on both axes.
 *
 * @internal
 */
export function dimensionsAtLeast(
  dimensions: ImageCropDimensions,
  threshold: ImageCropDimensions,
): boolean {
  return dimensions.width >= threshold.width && dimensions.height >= threshold.height
}

function isCompleteCrop(crop: ImageCrop | undefined): crop is ImageCrop {
  return [crop?.top, crop?.bottom, crop?.left, crop?.right].every(
    (inset) => typeof inset === 'number' && Number.isFinite(inset),
  )
}

/**
 * The pixel size of an image value after its crop, or the source size when it has no crop. Read
 * from the asset reference, so it needs no request. `undefined` when the value has no raster
 * asset with encoded dimensions.
 *
 * @internal
 */
export function getCroppedImageDimensions(
  value: Pick<ImageValue, 'asset' | 'crop'> | undefined,
): ImageCropDimensions | undefined {
  const source = getImageRefDimensions(value?.asset?._ref)
  if (source === undefined) {
    return undefined
  }
  const crop = value?.crop
  return isCompleteCrop(crop) ? croppedDimensions(cropToPixelRect(crop, source)) : source
}
