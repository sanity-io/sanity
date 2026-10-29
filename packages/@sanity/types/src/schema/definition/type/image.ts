import {type ImageCrop, type ImageHotspot} from '../../../assets/types'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {type FieldDefinition} from '../schemaDefinition'
import {type FileOptions, type FileValue} from './file'
import {type ObjectDefinition} from './object'

/** @public */
export type ImageMetadataType =
  | 'blurhash'
  | 'thumbhash'
  | 'lqip'
  | 'palette'
  | 'exif'
  | 'image'
  | 'location'

/** @public */
export interface HotspotPreview {
  title: string
  aspectRatio: number
}

/** @public */
export interface HotspotOptions {
  previews?: HotspotPreview[]
}

/**
 * A range of allowed crop aspect ratios, each expressed as `width / height`.
 *
 * @public
 */
export interface ImageAspectRatioRange {
  /** The smallest allowed `width / height` ratio, which is the tallest allowed crop. */
  min: number
  /** The largest allowed `width / height` ratio, which is the widest allowed crop. */
  max: number
}

/**
 * The crop aspect ratio an image field allows, expressed as `width / height`:
 *
 * - a number locks the crop to that ratio (`16 / 9`)
 * - an {@link ImageAspectRatioRange} keeps the crop within a range (`{min: 4 / 3, max: 16 / 9}`)
 * - an array snaps the crop to one of the listed ratios (`[1, 4 / 3, 16 / 9]`)
 *
 * @public
 */
export type ImageAspectRatio = number | ImageAspectRatioRange | number[]

/**
 * A crop size in source image pixels.
 *
 * @public
 */
export interface ImageCropDimensions {
  width: number
  height: number
}

/** @public */
export interface ImageOptions extends FileOptions {
  metadata?: ImageMetadataType[]
  hotspot?: boolean | HotspotOptions
  /**
   * The crop aspect ratio the image must have. Document validation reports an error when the
   * cropped image, or the whole image when it has no crop, does not match it. SVG images are not
   * checked.
   *
   * @example
   * ```ts
   * options: {aspectRatio: 16 / 9}
   * options: {aspectRatio: {min: 4 / 3, max: 16 / 9}}
   * options: {aspectRatio: [1, 4 / 3, 16 / 9]}
   * ```
   */
  aspectRatio?: ImageAspectRatio
  /**
   * The smallest cropped size, in pixels, the image may have. Document validation reports an
   * error below it. SVG images are not checked.
   */
  minDimensions?: ImageCropDimensions
  /**
   * The cropped size, in pixels, the image should have for the best result. Document validation
   * reports a warning below it. SVG images are not checked.
   */
  recommendedDimensions?: ImageCropDimensions
}

/** @public */
export interface ImageValue extends FileValue {
  crop?: ImageCrop
  hotspot?: ImageHotspot
  [index: string]: unknown
}

/** @public */
export interface ImageRule extends RuleDef<ImageRule, ImageValue> {
  /**
   * Require an image field has an asset.
   *
   * @example
   * ```ts
   * defineField({
   *  name: 'image',
   *  title: 'Image',
   *  type: 'image',
   *  validation: (Rule) => Rule.required().assetRequired(),
   * })
   * ```
   */
  assetRequired(): ImageRule
}

/** @public */
export interface ImageDefinition extends Omit<
  ObjectDefinition,
  'type' | 'fields' | 'options' | 'groups' | 'validation'
> {
  type: 'image'
  fields?: FieldDefinition[]
  options?: ImageOptions
  validation?: ValidationBuilder<ImageRule, ImageValue>
  initialValue?: InitialValueProperty<any, ImageValue>
}
