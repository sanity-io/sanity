import {Box, Card, Flex, Portal} from '@sanity/ui'
import React, {ReactNode, useCallback, useEffect, useRef} from 'react'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {useCommandList} from '../../../../components'
import {useColorScheme} from '../../../colorScheme'
import {SharedCommandList} from './components/common/SharedCommandList'
import {Filters} from './components/filters/Filters'
import {RecentSearches} from './components/recentSearches/RecentSearches'
import {SearchHeader} from './components/SearchHeader'
import {SearchResults} from './components/searchResults/SearchResults'
import {useSearchState} from './contexts/search/useSearchState'
import {useSearchHotkeys} from './hooks/useSearchHotkeys'
import {hasSearchableTerms} from './utils/hasSearchableTerms'

interface SearchDialogProps {
  onClose: () => void
  onOpen: () => void
  open: boolean
}

const InnerCard = styled(Card)`
  flex-direction: column;
  overflow: hidden;
  pointer-events: all;
  position: relative;
`

const SearchDialogBox = styled(Box)`
  height: 100%;
  left: 0;
  overflow: hidden;
  pointer-events: none;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1;
`

/**
 * @internal
 */
export function SearchDialog({onClose, onOpen, open}: SearchDialogProps) {
  const isMountedRef = useRef(false)

  const {
    dispatch,
    setOnClose,
    state: {filtersVisible, lastActiveIndex, result, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  /**
   * Bind hotkeys to open action
   */
  useSearchHotkeys({onOpen, open})

  /**
   * Set shared `onClose` in search context
   */
  useEffect(() => {
    setOnClose(onClose)
  }, [onClose, setOnClose])

  /**
   * Store top-most search result scroll index on close
   */
  const handleClose = useCallback(
    (index?: number) => {
      if (index) {
        dispatch({index, type: 'LAST_ACTIVE_INDEX_SET'})
      }
      onClose()
    },
    [dispatch, onClose]
  )

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
   * Reset ordering when popover is closed (without valid search terms)
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

  if (!open) {
    return null
  }

  return (
    <Portal>
      <FocusLock autoFocus={false} returnFocus>
        <SharedCommandList hasValidTerms={hasValidTerms} initialIndex={lastActiveIndex}>
          <SearchDialogContent filtersVisible={filtersVisible} onClose={handleClose} open={open}>
            {hasValidTerms ? <SearchResults /> : <RecentSearches />}
          </SearchDialogContent>
        </SharedCommandList>
      </FocusLock>
    </Portal>
  )
}

function SearchDialogContent({
  children,
  filtersVisible,
  onClose,
  open,
}: {
  children?: ReactNode
  filtersVisible: boolean
  onClose: (lastActiveIndex?: number) => void
  open: boolean
}) {
  const {scheme} = useColorScheme()
  const {getTopIndex} = useCommandList()
  const {dispatch} = useSearchState()

  const handleClose = useCallback(() => {
    dispatch({index: getTopIndex(), type: 'LAST_ACTIVE_INDEX_SET'})
    onClose(getTopIndex())
  }, [dispatch, getTopIndex, onClose])

  /**
   * Bind hotkeys to close action
   */
  useSearchHotkeys({onClose: handleClose, open})

  return (
    <SearchDialogBox>
      <InnerCard display="flex" height="fill" scheme={scheme} tone="default">
        <SearchHeader onClose={handleClose} />
        {filtersVisible && (
          <Card borderTop flex="none">
            <Filters />
          </Card>
        )}

        <Flex>{children}</Flex>
      </InnerCard>
    </SearchDialogBox>
  )
}
