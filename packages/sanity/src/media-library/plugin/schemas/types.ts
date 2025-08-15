import {type Asset} from '@sanity/media-library-types'
import {
  type AssetSource,
  type InitialValueProperty,
  type ObjectDefinition,
  type ObjectOptions,
  type ObjectSchemaType,
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
   *  type: 'sanity.video',
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
  type: 'sanity.video'
  fields?: ObjectDefinition['fields']
  options?: VideoOptions
  validation?: ValidationBuilder<VideoRule, VideoValue>
  initialValue?: InitialValueProperty<any, VideoValue>
}

/** @public */
export interface VideoSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: VideoOptions
}

/** @public */
export interface VideoMetadataPlayback {
  _type: 'sanity.videoMetadata.playback'
  _id: string
  _key: string
  policy: 'public' | 'secured'
}

/** @public */
export interface VideoMetadata {
  [key: string]: unknown
  _type: 'sanity.videoMetadata'
  aspectRatio?: number
  duration?: number
  framerate?: number
  playbacks?: VideoMetadataPlayback[]
}

/** @public */
export type VideoAsset = Omit<Asset, '_type'> & {
  _type: 'sanity.videoAsset'
  metadata: VideoMetadata
}
