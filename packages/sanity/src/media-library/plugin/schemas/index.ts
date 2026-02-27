import {type ObjectDefinition} from '@sanity/types'

import {type VideoOptions} from './types'
import {video} from './video'
import {videoAsset} from './videoAsset'
import {videoAssetMetadata, videoAssetMetadataPlayback} from './videoAssetMetadata'

/**
 * @public
 * @beta
 */
export const videoTypeName = 'sanity.video' as const

/**
 * @public
 * @beta
 */
export interface VideoDefinition extends Omit<ObjectDefinition, 'type' | 'fields' | 'options'> {
  type: typeof videoTypeName
  options?: VideoOptions
}

declare module '@sanity/types' {
  // makes type: 'sanity.video' narrow correctly when using defineType/defineField/defineArrayMember
  export interface IntrinsicDefinitions {
    'sanity.video': VideoDefinition
  }
}

export const mediaLibrarySchemas = [
  video,
  videoAsset,
  videoAssetMetadata,
  videoAssetMetadataPlayback,
]
