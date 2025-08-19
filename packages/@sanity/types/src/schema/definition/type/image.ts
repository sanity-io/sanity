import {type ComponentType} from 'react'

import {type ImageCrop, type ImageHotspot} from '../../../assets'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {
  type BlockAnnotationProps,
  type BlockProps,
  type ObjectFieldProps,
  type ObjectInputProps,
  type ObjectItem,
  type ObjectItemProps,
  type PreviewProps,
} from '../props'
import {type FieldDefinition} from '../schemaDefinition'
import {type FileOptions, type FileValue} from './file'
import {type ObjectDefinition} from './object'

/** @public */
export type ImageMetadataType = 'blurhash' | 'lqip' | 'palette' | 'exif' | 'image' | 'location'

/** @public */
export interface HotspotPreview {
  title: string
  aspectRatio: number
}

/** @public */
export interface HotspotOptions {
  previews?: HotspotPreview[]
}

/** @public */
export interface ImageOptions extends FileOptions {
  metadata?: ImageMetadataType[]
  hotspot?: boolean | HotspotOptions
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

/**
 *
 * @hidden
 * @beta
 */
export interface ImageComponents {
  annotation?: ComponentType<BlockAnnotationProps>
  block?: ComponentType<BlockProps>
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<ImageValue>>
  inlineBlock?: ComponentType<BlockProps>
  input?: ComponentType<ObjectInputProps<ImageValue>>
  item?: ComponentType<ObjectItemProps<ImageValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/** @public */
export interface ImageDefinition
  extends Omit<ObjectDefinition, 'type' | 'fields' | 'options' | 'groups' | 'validation'> {
  type: 'image'
  fields?: FieldDefinition[]
  options?: ImageOptions
  validation?: ValidationBuilder<ImageRule, ImageValue>
  initialValue?: InitialValueProperty<any, ImageValue>
  /**
   *
   * @hidden
   * @beta
   */
  components?: ImageComponents
}
