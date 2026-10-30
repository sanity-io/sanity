import {isHotspotEnabled} from '@sanity/schema/_internal'
import {type ImageOptions} from '@sanity/types'

const HOTSPOT_PATH = ['hotspot']
const CROP_PATH = ['crop']

/**
 * The field that owns the crop tool and its dialog. The schema hides the hotspot field when the
 * hotspot is off, so the crop field owns a crop-only tool.
 */
export function getImageToolPath(options: ImageOptions | undefined): string[] {
  return isHotspotEnabled(options) ? HOTSPOT_PATH : CROP_PATH
}
