import {type ObjectSchemaType} from '@sanity/types'
import {
  type AssetSource,
  type InitialValueProperty,
  type ObjectDefinition,
  type ObjectOptions,
  type Reference,
  type RuleDef,
  type ValidationBuilder,
} from '@sanity/types'

/** @public */
export interface VideoOptions extends ObjectOptions {
  storeOriginalFilename?: boolean
  accept?: string
  sources?: AssetSource[]
}

/** @public */
export interface VideoRule extends RuleDef<VideoRule, VideoValue> {
  /**
   * Require a file field has an asset.
   *
   * @example
   * ```ts
   * defineField({
   *  name: 'video',
   *  title: 'Video',
   *  type: 'video',
   *  validation: (Rule) => Rule.required().assetRequired(),
   * })
   * ```
   */
  assetRequired(): VideoRule
}

/** @public */
export interface VideoValue {
  asset?: Reference
  [index: string]: unknown
}

/** @public */
export interface VideoDefinition
  extends Omit<ObjectDefinition, 'type' | 'fields' | 'options' | 'groups' | 'validation'> {
  type: 'video'
  fields?: ObjectDefinition['fields']
  options?: VideoOptions
  validation?: ValidationBuilder<VideoRule, VideoValue>
  initialValue?: InitialValueProperty<any, VideoValue>
}

/** @public */
export interface VideoSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: VideoOptions
}
