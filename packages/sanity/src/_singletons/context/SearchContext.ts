import {createContext} from 'sanity/_createContext'

import type {SearchContextValue} from '../../core/studio/components/navbar/search/contexts/search/SearchContext'

/**
 * @internal
 */
export const SearchContext = createContext<SearchContextValue | undefined>(
  'sanity/_singletons/context/search',
  undefined,
)
