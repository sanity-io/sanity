import {DocumentIcon} from '@sanity/icons/Document'
import {ImageIcon} from '@sanity/icons/Image'
import {
  type Asset,
  type AssetSource,
  type AssetSourceComponentProps,
  type AssetSourceOpenInSourceResult,
} from '@sanity/types'

import {type FederatedAssetSourceView} from '../federatedAssetSource/types'
import {FederatedMediaLibraryAssetSource} from './federated/FederatedMediaLibraryAssetSource'
import {MediaLibraryAssetSource} from './shared/MediaLibraryAssetSource'
import {MediaLibraryUploader} from './uploader'

// Default name for the Media Library asset source
// This is used to identify assets created from the Media Library in the openInSource function,
// so don't change it unless you know what you're doing (asset documents will have this source name).
// The asset source plugin's name itself is still configurable by the user (props.name).
export const sourceName = 'sanity-media-library'
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
  if (asset.source?.name === sourceName) {
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

/**
 * Props for the federated Media Library source factories: the iframe factory
 * props plus the brokered view that renders the select dialog.
 *
 * @internal
 */
export interface CreateFederatedSanityMediaLibrarySourceProps extends CreateSanityMediaLibrarySourceProps {
  view: FederatedAssetSourceView
}

/**
 * The Media Library image source with a federated select dialog (the
 * organization's brokered `asset_source` view). Identical to
 * {@link createSanityMediaLibraryImageSource} — same `name`, uploader and
 * open-in-source behavior — except that selecting mounts the federated view,
 * falling back to the iframe dialog when the view fails to load.
 *
 * @internal
 */
export function createFederatedSanityMediaLibraryImageSource(
  props: CreateFederatedSanityMediaLibrarySourceProps,
): AssetSource {
  return {
    name: props.name || sourceName,
    i18nKey: props.i18nKey || 'asset-sources.media-library.image.title',
    component: (sourceProps: AssetSourceComponentProps) => (
      <FederatedMediaLibraryAssetSource
        {...sourceProps}
        libraryId={props.libraryId}
        view={props.view}
      />
    ),
    icon: props.icon || ImageIcon,
    Uploader: MediaLibraryUploader,
    openInSource,
  }
}

/**
 * The Media Library file source with a federated select dialog. See
 * {@link createFederatedSanityMediaLibraryImageSource}.
 *
 * @internal
 */
export function createFederatedSanityMediaLibraryFileSource(
  props: CreateFederatedSanityMediaLibrarySourceProps,
): AssetSource {
  return {
    name: props.name || sourceName,
    i18nKey: props.i18nKey || 'asset-sources.media-library.file.title',
    component: (sourceProps: AssetSourceComponentProps) => (
      <FederatedMediaLibraryAssetSource
        {...sourceProps}
        libraryId={props.libraryId}
        view={props.view}
      />
    ),
    icon: props.icon || DocumentIcon,
    Uploader: MediaLibraryUploader,
    openInSource,
  }
}
