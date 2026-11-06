import {type ReactNode, useEffect, useMemo} from 'react'
import {SearchContext} from 'sanity/_singletons'

import {type SearchContextValue} from '../../contexts/search/SearchContext'
import {useSearchState} from '../../contexts/search/useSearchState'
import {useSearchCloseHandler} from '../../hooks/useSearchCloseHandler'
import {useSearchHotkeys} from '../../hooks/useSearchHotkeys'

interface SearchWrapperProps {
  children: ReactNode
  onClose: () => void
  onOpen?: () => void
  open: boolean
}

export function SearchWrapper({children, onClose, onOpen, open}: SearchWrapperProps) {
  const searchContext = useSearchState()
  const {searchActorRef} = searchContext
  const handleClose = useSearchCloseHandler(onClose)

  useSearchHotkeys({onClose: handleClose, onOpen, open})

  // `open` is controlled by the parent, which can also close the search without going through
  // `handleClose`, so the machine learns about it here.
  useEffect(() => {
    searchActorRef.send({type: open ? 'SEARCH_OPENED' : 'SEARCH_CLOSED'})
  }, [open, searchActorRef])

  const value = useMemo(
    (): SearchContextValue => ({...searchContext, onClose: handleClose}),
    [handleClose, searchContext],
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}
