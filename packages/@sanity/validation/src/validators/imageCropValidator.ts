import {
  type CustomValidator,
  type ImageAspectRatio,
  type ImageCropDimensions,
  isImage,
  type ValidationContext,
  type ValidationError,
} from '@sanity/types'
import {
  describeAspectRatio,
  dimensionsAtLeast,
  getCroppedImageDimensions,
  ratioMatchesConstraint,
  resolveAspectRatio,
} from '@sanity/util/image'

import {validationMarkerCodes} from '../codes'

function getValueDimensions(value: unknown): ImageCropDimensions | undefined {
  return getCroppedImageDimensions(isImage(value) ? value : undefined)
}

function checkMinDimensions(
  dimensions: ImageCropDimensions,
  minDimensions: ImageCropDimensions | undefined,
  context: ValidationContext,
): ValidationError[] {
  if (minDimensions === undefined || dimensionsAtLeast(dimensions, minDimensions)) {
    return []
  }
  return [
    {
      code: validationMarkerCodes.imageBelowMinDimensions,
      details: {actual: dimensions, required: minDimensions},
      message: context.i18n.t('validation:object.image-below-min-dimensions', {
        width: minDimensions.width,
        height: minDimensions.height,
      }),
    },
  ]
}

function checkAspectRatio(
  dimensions: ImageCropDimensions,
  aspectRatio: ImageAspectRatio | undefined,
  context: ValidationContext,
): ValidationError[] {
  if (aspectRatio === undefined) {
    return []
  }
  const resolved = resolveAspectRatio(aspectRatio)
  const actualRatio = dimensions.width / dimensions.height
  if (ratioMatchesConstraint(actualRatio, resolved)) {
    return []
  }
  return [
    {
      code: validationMarkerCodes.imageAspectRatioMismatch,
      details: {actual: {...dimensions, aspectRatio: actualRatio}, required: {aspectRatio}},
      message: context.i18n.t('validation:object.image-aspect-ratio-mismatch', {
        aspectRatio: describeAspectRatio(resolved),
      }),
    },
  ]
}

/**
 * Checks the cropped size of an image against `minDimensions` and its ratio against
 * `aspectRatio`. Dimensions come from the asset reference, so an SVG, an empty value or a
 * reference without dimensions passes.
 *
 * @internal
 */
export function createImageCropValidator({
  aspectRatio,
  minDimensions,
}: {
  aspectRatio?: ImageAspectRatio
  minDimensions?: ImageCropDimensions
}): CustomValidator {
  return (value, context) => {
    const dimensions = getValueDimensions(value)
    if (dimensions === undefined) return true

    const errors = [
      ...checkMinDimensions(dimensions, minDimensions, context),
      ...checkAspectRatio(dimensions, aspectRatio, context),
    ]
    return errors.length > 0 ? errors : true
  }
}

/**
 * Checks the cropped size of an image against `recommendedDimensions`.
 *
 * @internal
 */
export function createImageRecommendedDimensionsValidator(
  recommendedDimensions: ImageCropDimensions,
): CustomValidator {
  return (value, context) => {
    const dimensions = getValueDimensions(value)
    if (dimensions === undefined || dimensionsAtLeast(dimensions, recommendedDimensions)) {
      return true
    }
    return {
      code: validationMarkerCodes.imageBelowRecommendedDimensions,
      details: {actual: dimensions, required: recommendedDimensions},
      message: context.i18n.t('validation:object.image-below-recommended-dimensions', {
        width: recommendedDimensions.width,
        height: recommendedDimensions.height,
      }),
    }
  }
}
