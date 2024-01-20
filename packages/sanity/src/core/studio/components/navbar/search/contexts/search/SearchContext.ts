import {createContext, type Dispatch, type SetStateAction} from 'react'

import {type CommandListHandle} from '../../../../../../components/commandList/types'
import {type RecentSearchesStore} from '../../datastores/recentSearches'
import {type SearchAction, type SearchReducerState} from './reducer'

export interface SearchContextValue {
  dispatch: Dispatch<SearchAction>
  onClose: (() => void) | null
  recentSearchesStore?: RecentSearchesStore
  searchCommandList: CommandListHandle | null
  setSearchCommandList: Dispatch<SetStateAction<CommandListHandle | null>>
  setOnClose: (onClose: () => void) => void
  state: SearchReducerState
}

export const SearchContext = createContext<SearchContextValue | undefined>(undefined)
