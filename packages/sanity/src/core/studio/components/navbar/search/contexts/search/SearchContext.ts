import {type RefObject} from 'react'

import {type CommandListHandle} from '../../../../../../components/commandList/types'
import {type GlobalSearchActorRef} from './globalSearchMachine'

/**
 * @internal
 */
export interface SearchContextValue {
  /**
   * Holds all search state for the lifetime of the provider. Read it with `useSearchSelector`,
   * which only re-renders when the selected slice changes, and send it events to change it.
   */
  searchActorRef: GlobalSearchActorRef
  /** The search results list, read when the search closes to restore its scroll position. */
  searchCommandListRef: RefObject<CommandListHandle | null>
  /** Closes the search. Only set inside `SearchPopover` and `SearchDialog`. */
  onClose: (() => void) | null
  fullscreen?: boolean
  disabledDocumentIds?: string[]
  canDisableAction?: boolean
}
