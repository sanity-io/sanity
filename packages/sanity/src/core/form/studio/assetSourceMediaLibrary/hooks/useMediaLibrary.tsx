import {useContext} from 'react'

import {MediaLibraryContext, type MediaLibraryContextValue} from '../shared/MediaLibraryProvider'

export function useMediaLibrary(): MediaLibraryContextValue {
  const context = useContext(MediaLibraryContext)
  const {mediaLibraryId} = context
  return {mediaLibraryId}
}
