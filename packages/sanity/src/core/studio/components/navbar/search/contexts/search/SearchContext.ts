import {createContext, Dispatch} from 'react'
import {RecentSearchesStore} from '../../datastores/recentSearches'
import type {SearchFilterGroup} from '../../types'
import {SearchAction, SearchReducerState} from './reducer'

export interface SearchContextValue {
  dispatch: Dispatch<SearchAction>
  filterGroups: SearchFilterGroup[]
  recentSearchesStore?: RecentSearchesStore
  state: SearchReducerState
}

export const SearchContext = createContext<SearchContextValue | undefined>(undefined)
