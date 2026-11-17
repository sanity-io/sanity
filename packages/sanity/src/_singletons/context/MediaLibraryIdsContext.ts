import {createContext} from 'react'

import type {MediaLibraryIds} from '../../core/form/studio/assetSourceMediaLibrary/shared/MediaLibraryProvider'

/** @internal */
export const MediaLibraryIdsContext = createContext<MediaLibraryIds | null>(null)
