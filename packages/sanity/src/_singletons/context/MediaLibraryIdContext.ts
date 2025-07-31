import {createContext} from 'sanity/_createContext'

/** @internal */
export const MediaLibraryIdContext = createContext<{
  libraryId: string
  organizationId: string
} | null>('sanity/_singletons/context/media-library', null)
