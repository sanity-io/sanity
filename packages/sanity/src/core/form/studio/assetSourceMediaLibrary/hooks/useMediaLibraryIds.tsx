import {useContext} from 'react'
import {MediaLibraryIdsContext} from 'sanity/_singletons'

import {type MediaLibraryIds} from '../shared/MediaLibraryProvider'

export function useMediaLibraryIds(): MediaLibraryIds | null {
  return useContext(MediaLibraryIdsContext)
}
