import {useContext} from 'react'
import {MediaLibraryIdContext} from 'sanity/_singletons'

export function useMediaLibraryIds(): {libraryId: string; organizationId: string} | null {
  return useContext(MediaLibraryIdContext)
}
