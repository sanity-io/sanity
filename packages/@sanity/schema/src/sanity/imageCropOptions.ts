import {type ImageAspectRatio, type ImageCropDimensions} from '@sanity/types'

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isAspectRatioRange(value: unknown): boolean {
  if (value && typeof value === 'object' && 'min' in value && 'max' in value) {
    const {min, max} = value
    return isPositiveFiniteNumber(min) && isPositiveFiniteNumber(max) && min <= max
  }
  return false
}

/**
 * Whether a value is a usable image `options.aspectRatio`: a positive number, a `{min, max}` range
 * of positive numbers, or a non-empty array of positive numbers.
 *
 * @internal
 */
export function isValidImageAspectRatio(value: unknown): value is ImageAspectRatio {
  if (Array.isArray(value)) {
    return value.length > 0 && value.every(isPositiveFiniteNumber)
  }
  return isPositiveFiniteNumber(value) || isAspectRatioRange(value)
}

/**
 * Whether a value is a usable image `options.minDimensions` or `options.recommendedDimensions`: an
 * object with a positive `width` and `height`.
 *
 * @internal
 */
export function isValidImageCropDimensions(value: unknown): value is ImageCropDimensions {
  if (value && typeof value === 'object' && 'width' in value && 'height' in value) {
    return isPositiveFiniteNumber(value.width) && isPositiveFiniteNumber(value.height)
  }
  return false
}
