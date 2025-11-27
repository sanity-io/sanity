import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {MediaLibraryIds} from '../../core/form/studio/assetSourceMediaLibrary/shared/MediaLibraryProvider'

/** @internal */
export const MediaLibraryIdsContext: Context<MediaLibraryIds | null> =
  createContext<MediaLibraryIds | null>('sanity/_singletons/context/media-library', null)
