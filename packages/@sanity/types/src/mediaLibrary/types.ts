import {type FileAsset, type ImageAsset} from '../assets/types'
import {type SanityDocumentLike} from '../documents/types'
import {type FieldDefinition, type IntrinsicTypeName} from '../schema/definition/schemaDefinition'

/**
 * @public
 */
export type MediaLibraryAssetAspectSupportedFieldDefinitions = FieldDefinition<
  Exclude<IntrinsicTypeName, 'document' | 'image' | 'file' | 'reference' | 'crossDatasetReference'>
>

/**
 * @public
 */
export type MediaLibraryAssetAspectDefinition = MediaLibraryAssetAspectSupportedFieldDefinitions & {
  assetType?: MediaLibraryAssetType | MediaLibraryAssetType[]
}

/**
 * @public
 */
export const MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME = 'sanity.asset.aspect'

/**
 * @public
 */
export type MediaLibraryAssetAspectTypeName = typeof MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME

/**
 * @public
 */
export type MediaLibraryAssetType = ImageAsset['_type'] | FileAsset['_type']

/**
 * A document representing a Media Library asset aspect.
 *
 * Each aspect provides a schema describing custom data that can be assigned to assets.
 *
 * @public
 */
export interface MediaLibraryAssetAspectDocument extends SanityDocumentLike {
  _type: MediaLibraryAssetAspectTypeName
  /**
   * Asset types the aspect can be assigned to.
   *
   * If no `assetType` is defined, the aspect may be assigned to any asset type.
   */
  assetType?: MediaLibraryAssetType[]
  definition: FieldDefinition
}
