import {DocumentIcon, ImageIcon} from '@sanity/icons'
import {type AssetSource, type AssetSourceComponentProps} from '@sanity/types'

import {AssetLibrarySource} from './shared/AssetLibrarySource'

export interface CreateSanityAssetLibrarySourceProps {
  i18nKey?: string
  icon?: React.ComponentType
  libraryId: string | null
  name: string
}

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
