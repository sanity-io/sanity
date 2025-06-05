import {createContext} from 'sanity/_createContext'

/** @internal */
export const MediaLibraryIdContext = createContext<string | null>(
  'sanity/_singletons/context/media-library',
  null,
)
