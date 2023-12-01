import type {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import type {InitialValueProperty} from '../../types'
import type {FieldDefinition} from '../schemaDefinition'
import type {ImageCrop, ImageHotspot} from '../../../assets'
import type {FileOptions, FileValue} from './file'
import type {ObjectDefinition} from './object'

/** @public */
export type ImageMetadataType = 'blurhash' | 'lqip' | 'palette' | 'exif' | 'location'

/** @public */
export interface ImageOptions extends FileOptions {
  metadata?: ImageMetadataType[]
  hotspot?: boolean
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
export interface ImageDefinition
  extends Omit<ObjectDefinition, 'type' | 'fields' | 'options' | 'groups' | 'validation'> {
  type: 'image'
  fields?: FieldDefinition[]
  options?: ImageOptions
  validation?: ValidationBuilder<ImageRule, ImageValue>
  initialValue?: InitialValueProperty<any, ImageValue>
}
