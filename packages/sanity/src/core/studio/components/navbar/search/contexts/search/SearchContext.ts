import {createContext, Dispatch} from 'react'
import {RecentSearchesStore} from '../../datastores/recentSearches'
import {SearchAction, SearchReducerState} from './reducer'

export interface SearchContextValue {
  dispatch: Dispatch<SearchAction>
  state: SearchReducerState
  recentSearchesStore?: RecentSearchesStore
}

export const SearchContext = createContext<SearchContextValue | undefined>(undefined)
