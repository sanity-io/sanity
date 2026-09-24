import {useCallback} from 'react'

import {useSearchState} from '../contexts/search/useSearchState'

/**
 * Wraps `onClose` to remember the scroll position of the search results, which the results list
 * restores when the search opens again.
 */
export function useSearchCloseHandler(onClose: () => void): () => void {
  const {searchActorRef, searchCommandListRef} = useSearchState()

  return useCallback(() => {
    searchActorRef.send({
      type: 'LAST_ACTIVE_INDEX_SET',
      index: searchCommandListRef.current?.getTopIndex() ?? -1,
    })
    onClose()
  }, [onClose, searchActorRef, searchCommandListRef])
}
