import {createContext, Dispatch} from 'react'
import {RecentSearchesStore} from '../../datastores/recentSearches'
import {ResolvedField} from '../../utils/createFieldRegistry'
import {SearchAction, SearchReducerState} from './reducer'

export interface SearchContextValue {
  dispatch: Dispatch<SearchAction>
  fieldRegistry: ResolvedField[]
  recentSearchesStore?: RecentSearchesStore
  state: SearchReducerState
}

export const SearchContext = createContext<SearchContextValue | undefined>(undefined)
