import {type Dispatch, type SetStateAction} from 'react'

import {type CommandListHandle} from '../../../../../../components/commandList/types'
import {type SearchAction, type SearchReducerState} from './reducer'

/**
 * @internal
 */
export interface SearchContextValue {
  dispatch: Dispatch<SearchAction>
  onClose: (() => void) | null
  searchCommandList: CommandListHandle | null
  setSearchCommandList: Dispatch<SetStateAction<CommandListHandle | null>>
  setOnClose: (onClose: () => void) => void
  state: SearchReducerState
}
