import {
  MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME,
  type MediaLibraryAssetAspectDefinition,
  type MediaLibraryAssetAspectDocument,
} from './types'

/**
 * Define a Media Library asset aspect.
 *
 * Aspects can be deployed using the `sanity media deploy-aspect` CLI command.
 *
 * @public
 * @beta
 */
export function defineAssetAspect(
  definition: MediaLibraryAssetAspectDefinition,
): MediaLibraryAssetAspectDocument {
  const {assetType, name} = definition

  return {
    _type: MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME,
    _id: `${name}`,
    definition,
    ...(assetType && {
      assetType: Array.isArray(assetType) ? assetType : [assetType],
    }),
  }
}
