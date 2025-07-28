import {createContext} from 'sanity/_createContext'

/** @internal */
export const MediaLibraryIdContext: React.Context<string | null> = createContext<string | null>(
  'sanity/_singletons/context/media-library',
  null,
)
