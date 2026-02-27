import {DocumentIcon, ImageIcon} from '@sanity/icons'
import {
  type Asset,
  type AssetSource,
  type AssetSourceComponentProps,
  type AssetSourceOpenInSourceResult,
} from '@sanity/types'

import {MediaLibraryAssetSource} from './shared/MediaLibraryAssetSource'
import {MediaLibraryUploader} from './uploader'

// Default name for the Media Library asset source
// This is used to identify assets created from the Media Library in the openInSource function,
// so don't change it unless you know what you're doing (asset documents will have this source name).
// The asset source plugin's name itself is still configurable by the user (props.name).
export const MEDIA_LIBRARY_SOURCE_NAME = 'sanity-media-library'
export interface CreateSanityMediaLibrarySourceProps {
  i18nKey?: string
  icon?: React.ComponentType
  libraryId: string | null
  name?: string
}

/**
 * Check if this asset source can open an asset in source.
 * Returns `{ type: 'component' }` if the asset was created from the Media Library.
 */
function openInSource(asset: Asset): AssetSourceOpenInSourceResult {
  // Check if the asset's source name matches the Media Library source name
  if (asset.source?.name === MEDIA_LIBRARY_SOURCE_NAME) {
    return {type: 'component'}
  }
  return false
}

/**
 * Create a new image asset source for the Media Library
 *
 * @beta
 */
export function createSanityMediaLibraryImageSource(
  props: CreateSanityMediaLibrarySourceProps,
): AssetSource {
  return {
    name: props.name || MEDIA_LIBRARY_SOURCE_NAME,
    i18nKey: props.i18nKey || 'asset-sources.media-library.image.title',
    component: (sourceProps: AssetSourceComponentProps) => (
      <MediaLibraryAssetSource {...sourceProps} libraryId={props.libraryId} />
    ),
    icon: props.icon || ImageIcon,
    Uploader: MediaLibraryUploader,
    openInSource,
  }
}

/**
 * Create a new file asset source for the Media Library
 *
 * @beta
 */
export function createSanityMediaLibraryFileSource(
  props: CreateSanityMediaLibrarySourceProps,
): AssetSource {
  return {
    name: props.name || MEDIA_LIBRARY_SOURCE_NAME,
    i18nKey: props.i18nKey || 'asset-sources.media-library.file.title',
    component: (sourceProps: AssetSourceComponentProps) => (
      <MediaLibraryAssetSource {...sourceProps} libraryId={props.libraryId} />
    ),
    icon: props.icon || DocumentIcon,
    Uploader: MediaLibraryUploader,
    openInSource,
  }
}
