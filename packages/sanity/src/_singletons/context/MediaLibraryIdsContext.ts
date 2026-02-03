import type {MediaLibraryIds} from '../../core/form/studio/assetSourceMediaLibrary/shared/MediaLibraryProvider'
import {createContext} from 'sanity/_createContext'

/** @internal */
export const MediaLibraryIdsContext = createContext<MediaLibraryIds | null>(
  'sanity/_singletons/context/media-library',
  null,
)
