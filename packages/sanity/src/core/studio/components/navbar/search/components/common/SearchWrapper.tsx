import React, {ReactNode, useCallback, useEffect, useRef} from 'react'
import {useSearchState} from '../../contexts/search/useSearchState'
import {useSearchHotkeys} from '../../hooks/useSearchHotkeys'

interface SearchWrapperProps {
  children: ReactNode
  hasValidTerms: boolean
  onClose: () => void
  onOpen: () => void
  open: boolean
}

export function SearchWrapper({
  children,
  hasValidTerms,
  onClose,
  onOpen,
  open,
}: SearchWrapperProps) {
  const isMountedRef = useRef(false)

  const {
    dispatch,
    searchCommandList,
    setOnClose,
    state: {result},
  } = useSearchState()

  /**
   * Store top-most search result scroll index on close
   */
  const handleClose = useCallback(() => {
    dispatch({index: searchCommandList?.getTopIndex() ?? -1, type: 'LAST_ACTIVE_INDEX_SET'})
    onClose()
  }, [dispatch, onClose, searchCommandList])

  /**
   * Bind hotkeys to open action
   */
  useSearchHotkeys({onClose: handleClose, onOpen, open})

  /**
   * Set shared `onClose` in search context
   */
  useEffect(() => {
    setOnClose(handleClose)
  }, [handleClose, setOnClose])

  /**
   * Reset last search index when new results are loaded, or visiting recent searches
   */
  // @todo Revise if/when we introduce pagination
  useEffect(() => {
    if ((!hasValidTerms || result.loaded) && isMountedRef.current) {
      dispatch({index: 0, type: 'LAST_ACTIVE_INDEX_SET'})
    }
  }, [dispatch, hasValidTerms, result.loaded])

  /**
   * Reset ordering when is closed (without valid search terms)
   */
  useEffect(() => {
    if (!hasValidTerms && isMountedRef.current && !open) {
      dispatch({type: 'ORDERING_RESET'})
    }
  }, [dispatch, hasValidTerms, open])

  /**
   * Store mounted state
   */
  useEffect(() => {
    if (!isMountedRef?.current) {
      isMountedRef.current = true
    }
  }, [])

  return children
}
