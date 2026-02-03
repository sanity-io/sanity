import {type MediaLibraryIds} from '../shared/MediaLibraryProvider'
import {useContext} from 'react'
import {MediaLibraryIdsContext} from 'sanity/_singletons'

export function useMediaLibraryIds(): MediaLibraryIds | null {
  return useContext(MediaLibraryIdsContext)
}
