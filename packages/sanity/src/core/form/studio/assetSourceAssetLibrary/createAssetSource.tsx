import {DocumentIcon, ImageIcon} from '@sanity/icons'
import {type AssetSource, type AssetSourceComponentProps} from '@sanity/types'

import {AssetLibrarySource} from './shared/AssetLibrarySource'

export interface CreateSanityAssetLibrarySourceProps {
  i18nKey?: string
  icon?: React.ComponentType
  libraryId: string | null
  name: string
}

/**
 * Create a new image asset source for the asset library
 *
 * @beta
 */
export function createSanityAssetLibraryImageSource(
  props: CreateSanityAssetLibrarySourceProps,
): AssetSource {
  return {
    name: props.name,
    i18nKey: props.i18nKey || 'asset-source.asset-library.image.title',
    component: (sourceProps: AssetSourceComponentProps) => (
      <AssetLibrarySource {...sourceProps} libraryId={props.libraryId} />
    ),
    icon: props.icon || ImageIcon,
  }
}

/**
 * Create a new file asset source for the asset library
 *
 * @beta
 */
export function createSanityAssetLibraryFileSource(
  props: CreateSanityAssetLibrarySourceProps,
): AssetSource {
  return {
    name: props.name,
    i18nKey: props.i18nKey || 'asset-source.asset-library.file.title',
    component: (sourceProps: AssetSourceComponentProps) => (
      <AssetLibrarySource {...sourceProps} libraryId={props.libraryId} />
    ),
    icon: props.icon || DocumentIcon,
  }
}
