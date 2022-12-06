import {createContext, Dispatch} from 'react'
import {RecentSearchesStore} from '../../datastores/recentSearches'
import {SearchAction, SearchReducerState} from './reducer'

export interface SearchContextValue {
  dispatch: Dispatch<SearchAction>
  onClose: (() => void) | null
  recentSearchesStore?: RecentSearchesStore
  setOnClose: (onClose: () => void) => void
  state: SearchReducerState
}

export const SearchContext = createContext<SearchContextValue | undefined>(undefined)
