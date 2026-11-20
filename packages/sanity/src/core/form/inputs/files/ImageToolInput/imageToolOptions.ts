import {isHotspotEnabled} from '@sanity/schema/_internal'
import {
  type Image,
  type ImageCrop,
  type ImageCropDimensions,
  type ImageOptions,
} from '@sanity/types'
import {
  defaultCropRect,
  dimensionsMatchConstraint,
  getCroppedImageDimensions,
  getImageRefDimensions,
  pixelRectToCrop,
  type ResolvedImageAspectRatio,
} from '@sanity/util/image'

const HOTSPOT_PATH = ['hotspot']
const CROP_PATH = ['crop']

/**
 * The field that owns the crop tool and its dialog. The schema hides the hotspot field when the
 * hotspot is off, so the crop field owns a crop-only tool.
 */
export function getImageToolPath(options: ImageOptions | undefined): string[] {
  return isHotspotEnabled(options) ? HOTSPOT_PATH : CROP_PATH
}

/**
 * The crop the tool starts from. A crop that is missing or fails the aspect ratio becomes the
 * largest centered crop at the allowed ratio, at a listed ratio that holds `minDimensions` when
 * one can, so the first box the editor sees, and anything they commit from it, passes validation.
 * Without a ratio or a source size the stored crop is kept.
 */
export function getInitialToolCrop(
  value: Partial<Image> | undefined,
  constraint: ResolvedImageAspectRatio | undefined,
  minDimensions?: ImageCropDimensions,
): ImageCrop | undefined {
  const source = getImageRefDimensions(value?.asset?._ref)
  if (constraint === undefined || source === undefined) {
    return value?.crop
  }
  return dimensionsMatchConstraint(getCroppedImageDimensions(value) ?? source, constraint)
    ? value?.crop
    : pixelRectToCrop(defaultCropRect(source, constraint, minDimensions), source)
}
