import {type ImageOptions} from '@sanity/types'

import {getValidImageCropOptions} from '../../../sanity/imageCropOptions'

/**
 * Whether an image field has a hotspot, which shows its hotspot field. Any truthy `hotspot` counts,
 * so the studio's image tool and the compiled schema always agree on which field the tool edits.
 *
 * @internal
 */
export function isHotspotEnabled(options: ImageOptions | undefined): boolean {
  return Boolean(options?.hotspot)
}

function hasCropConstraints(options: ImageOptions | undefined): boolean {
  const {aspectRatio, minDimensions} = getValidImageCropOptions(options)
  return aspectRatio !== undefined || minDimensions !== undefined
}

/**
 * Whether an image field has the crop tool, which shows its crop field. A constrained crop is
 * edited in the crop tool even without a hotspot.
 *
 * @internal
 */
export function isImageToolEnabled(options: ImageOptions | undefined): boolean {
  return isHotspotEnabled(options) || hasCropConstraints(options)
}
