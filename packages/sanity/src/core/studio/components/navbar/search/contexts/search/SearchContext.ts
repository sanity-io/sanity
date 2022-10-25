import {createContext, Dispatch} from 'react'
import {RecentSearchesStore} from '../../datastores/recentSearches'
import type {KeyedSearchFilter} from '../../types'
import {SearchAction, SearchReducerState} from './reducer'

export interface SearchContextValue {
  availableFilters: KeyedSearchFilter[]
  dispatch: Dispatch<SearchAction>
  recentSearchesStore?: RecentSearchesStore
  state: SearchReducerState
}

export const SearchContext = createContext<SearchContextValue | undefined>(undefined)
