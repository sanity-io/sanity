import {type ImageOptions} from '@sanity/types'

const HOTSPOT_PATH = ['hotspot']
const CROP_PATH = ['crop']

export function isHotspotEnabled(options: ImageOptions | undefined): boolean {
  return typeof options?.hotspot === 'object' || options?.hotspot === true
}

/** Whether the field constrains its crop, which makes the crop tool available without a hotspot. */
function hasCropConstraints(options: ImageOptions | undefined): boolean {
  return options?.aspectRatio !== undefined || options?.minDimensions !== undefined
}

export function isImageToolEnabled(options: ImageOptions | undefined): boolean {
  return isHotspotEnabled(options) || hasCropConstraints(options)
}

/**
 * The field that owns the crop tool and its dialog. The schema hides the hotspot field when the
 * hotspot is off, so the crop field owns a crop-only tool.
 */
export function getImageToolPath(options: ImageOptions | undefined): string[] {
  return isHotspotEnabled(options) ? HOTSPOT_PATH : CROP_PATH
}
