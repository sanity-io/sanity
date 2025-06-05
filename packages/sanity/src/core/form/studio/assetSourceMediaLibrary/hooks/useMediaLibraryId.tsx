import {useContext} from 'react'
import {MediaLibraryIdContext} from 'sanity/_singletons'

export function useMediaLibraryId(): string | null {
  return useContext(MediaLibraryIdContext)
}
