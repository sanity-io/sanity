import {type ObjectDefinition} from '@sanity/types'

import {type VideoOptions} from './types'
import {video} from './video'
import {videoAsset} from './videoAsset'
import {videoAssetMetadata} from './videoAssetMetadata'

/**
 * @public
 * @beta
 */
export const videoTypeName = 'video' as const

/**
 * @public
 * @beta
 */
export interface VideoDefinition extends Omit<ObjectDefinition, 'type' | 'fields' | 'options'> {
  type: typeof videoTypeName
  options?: VideoOptions
}

declare module '@sanity/types' {
  // makes type: 'code' narrow correctly when using defineType/defineField/defineArrayMember
  export interface IntrinsicDefinitions {
    video: VideoDefinition
  }
}

export const mediaLibrarySchemas = [video, videoAsset, videoAssetMetadata]
