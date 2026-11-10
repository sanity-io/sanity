import {isHotspotEnabled} from '@sanity/schema/_internal'
import {
  type HotspotPreview,
  type Image,
  type ImageCrop,
  type ImageCropDimensions,
  type ImageOptions,
} from '@sanity/types'
import {
  defaultCropRect,
  describeAspectRatio,
  dimensionsAtLeast,
  dimensionsMatchConstraint,
  formatAspectRatio,
  getCroppedImageDimensions,
  getImageRefDimensions,
  pixelRectToCrop,
  resolveAspectRatio,
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

const DEFAULT_PREVIEWS: HotspotPreview[] = [
  {title: '3:4', aspectRatio: 3 / 4},
  {title: 'Square', aspectRatio: 1 / 1},
  {title: '16:9', aspectRatio: 16 / 9},
  {title: 'Panorama', aspectRatio: 4 / 1},
]

/**
 * The crop previews: the field's own `hotspot.previews` when set, otherwise one per ratio the
 * field allows (a range shows its bounds), otherwise a fixed set of common ratios.
 */
export function getHotspotPreviews(options: ImageOptions | undefined): HotspotPreview[] {
  const configuredPreviews =
    isHotspotEnabled(options) && typeof options?.hotspot === 'object'
      ? options.hotspot.previews
      : undefined
  if (configuredPreviews) {
    return configuredPreviews
  }
  if (options?.aspectRatio === undefined) {
    return DEFAULT_PREVIEWS
  }
  const {range, snapRatios} = resolveAspectRatio(options.aspectRatio)
  const ratios = snapRatios ?? [...new Set([range.min, range.max])]
  return ratios.map((ratio) => ({title: formatAspectRatio(ratio), aspectRatio: ratio}))
}

/** Whether the crop tool shows the size of the crop, which only matters with a size or ratio. */
export function hasCropSizeReadout(options: ImageOptions | undefined): boolean {
  return [options?.aspectRatio, options?.minDimensions, options?.recommendedDimensions].some(
    (option) => option !== undefined,
  )
}

/** The field's required aspect ratio in the words the validation message uses, when it has one. */
export function describeCropAspectRatio(options: ImageOptions | undefined): string | undefined {
  return options?.aspectRatio === undefined
    ? undefined
    : describeAspectRatio(resolveAspectRatio(options.aspectRatio))
}

export type CropSizeStatus =
  | {tone: 'critical' | 'caution'; threshold: ImageCropDimensions}
  | {tone: undefined; threshold: undefined}

/** How a crop of `dimensions` compares with the field's minimum and recommended sizes. */
export function getCropSizeStatus(
  dimensions: ImageCropDimensions,
  options: ImageOptions | undefined,
): CropSizeStatus {
  const {minDimensions, recommendedDimensions} = options ?? {}
  if (minDimensions && !dimensionsAtLeast(dimensions, minDimensions)) {
    return {tone: 'critical', threshold: minDimensions}
  }
  if (recommendedDimensions && !dimensionsAtLeast(dimensions, recommendedDimensions)) {
    return {tone: 'caution', threshold: recommendedDimensions}
  }
  return {tone: undefined, threshold: undefined}
}
