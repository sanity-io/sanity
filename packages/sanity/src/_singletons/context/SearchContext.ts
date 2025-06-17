import {createContext} from 'sanity/_createContext'

import type {SearchContextValue} from '../../core/studio/components/navbar/search/contexts/search/SearchContext'

/**
 * @internal
 */
export const SearchContext: React.Context<SearchContextValue | undefined> = createContext<
  SearchContextValue | undefined
>('sanity/_singletons/context/search', undefined)
