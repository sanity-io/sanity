import {DocumentIcon, ImageIcon} from '@sanity/icons'
import {
  type Asset,
  type AssetSource,
  type AssetSourceComponentProps,
  type AssetSourceOpenInSourceResult,
} from '@sanity/types'

import {MediaLibraryAssetSource} from './shared/MediaLibraryAssetSource'
import {MediaLibraryUploader} from './uploader'

export const sourceName = 'sanity-media-library'
export interface CreateSanityMediaLibrarySourceProps {
  i18nKey?: string
  icon?: React.ComponentType
  libraryId: string | null
  name?: string
}

/**
 * Check if this asset source can open an asset in source.
 * Returns \{ type: 'component' \} if the asset was created from the Media Library.
 */
function openInSource(asset: Asset): AssetSourceOpenInSourceResult {
  // Check if the asset's source name matches this asset source
  if (asset.source?.name === sourceName) {
    return {type: 'component' as const}
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
    name: props.name || sourceName,
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
    name: props.name || sourceName,
    i18nKey: props.i18nKey || 'asset-sources.media-library.file.title',
    component: (sourceProps: AssetSourceComponentProps) => (
      <MediaLibraryAssetSource {...sourceProps} libraryId={props.libraryId} />
    ),
    icon: props.icon || DocumentIcon,
    Uploader: MediaLibraryUploader,
    openInSource,
  }
}
