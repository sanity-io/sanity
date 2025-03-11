import {DocumentIcon, ImageIcon} from '@sanity/icons'
import {type AssetSource, type AssetSourceComponentProps} from '@sanity/types'

import {MediaLibrarySource} from './shared/MediaLibrarySource'

export interface CreateSanityMediaLibrarySourceProps {
  i18nKey?: string
  icon?: React.ComponentType
  libraryId: string | null
  name: string
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
    name: props.name,
    i18nKey: props.i18nKey || 'asset-source.media-library.image.title',
    component: (sourceProps: AssetSourceComponentProps) => (
      <MediaLibrarySource {...sourceProps} libraryId={props.libraryId} />
    ),
    icon: props.icon || ImageIcon,
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
    name: props.name,
    i18nKey: props.i18nKey || 'asset-source.media-library.file.title',
    component: (sourceProps: AssetSourceComponentProps) => (
      <MediaLibrarySource {...sourceProps} libraryId={props.libraryId} />
    ),
    icon: props.icon || DocumentIcon,
  }
}
