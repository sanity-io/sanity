import {Box, Card, Portal} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'
import {CommandListContainer} from './components/commandList/CommandListContainer'
import {Filters} from './components/filters/Filters'
import {RecentSearches} from './components/recentSearches/RecentSearches'
import {SearchHeader} from './components/SearchHeader'
import {SearchResults} from './components/searchResults/SearchResults'
import {CommandListProvider} from './components/commandList/CommandListProvider'
import {useSearchState} from './contexts/search/useSearchState'
import {useSearchHotkeys} from './hooks/useSearchHotkeys'
import {hasSearchableTerms} from './utils/hasSearchableTerms'
import {useCommandList} from './components/commandList/useCommandList'

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
  const [lastActiveIndex, setLastActiveIndex] = useState(-1)

  const {
    dispatch,
    setOnClose,
    state: {filtersVisible, recentSearches, result, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  /**
   * Store top-most search result scroll index on close
   */
  const handleClose = useCallback(
    (index: number) => {
      setLastActiveIndex(index)
      onClose()
    },
    [onClose]
  )

  /**
   * Bind hotkeys to open action
   */
  useSearchHotkeys({onOpen, open})

  /**
   * Reset last search index when new results are loaded, or visiting recent searches
   */
  // @todo Revise if/when we introduce pagination
  useEffect(() => {
    if ((!hasValidTerms || result.loaded) && isMountedRef.current) {
      setLastActiveIndex(0)
    }
  }, [hasValidTerms, result.loaded])

  /**
   * Reset ordering when popover is closed (without valid search terms)
   */
  useEffect(() => {
    if (!hasValidTerms && isMountedRef.current && !open) {
      dispatch({type: 'ORDERING_RESET'})
    }
  }, [dispatch, hasValidTerms, open])

  /**
   * Set shared `onClose` in search context
   */
  useEffect(() => {
    setOnClose(onClose)
  }, [onClose, setOnClose])

  /**
   * Store mounted state
   */
  useEffect(() => {
    if (!isMountedRef?.current) {
      isMountedRef.current = true
    }
  }, [])

  /**
   * Create a map of indices for our virtual list, ignoring non-filter items.
   * This is to ensure navigating via keyboard skips over these non-interactive items.
   */
  const itemIndices = useMemo(() => {
    if (hasValidTerms) {
      return Array.from(Array(result.hits.length).keys())
    }

    return Array.from(Array(recentSearches.length).keys())
  }, [hasValidTerms, recentSearches.length, result.hits.length])

  if (!open) {
    return null
  }

  return (
    <Portal>
      <FocusLock autoFocus={false} returnFocus>
        <CommandListProvider
          ariaActiveDescendant={itemIndices.length > 0}
          ariaChildrenLabel={hasValidTerms ? 'Search results' : 'Recent searches'}
          ariaHeaderLabel="Search"
          autoFocus
          data-testid="search-results-dialog"
          itemIndices={itemIndices}
          initialSelectedIndex={hasValidTerms ? lastActiveIndex : 0}
        >
          <SearchDialogContent
            filtersVisible={filtersVisible}
            hasValidTerms={hasValidTerms}
            onClose={handleClose}
            open={open}
          />
        </CommandListProvider>
      </FocusLock>
    </Portal>
  )
}

function SearchDialogContent({
  filtersVisible,
  hasValidTerms,
  onClose,
  open,
}: {
  filtersVisible: boolean
  hasValidTerms: boolean
  onClose: (lastActiveIndex: number) => void
  open: boolean
}) {
  const {scheme} = useColorScheme()
  const {getTopIndex} = useCommandList()

  /**
   * Store top-most search result scroll index on close
   */
  const handleClose = useCallback(() => {
    onClose(getTopIndex())
  }, [getTopIndex, onClose])

  /**
   * Bind hotkeys to close action
   */
  useSearchHotkeys({onClose: handleClose, open})

  return (
    <SearchDialogBox>
      <InnerCard display="flex" height="fill" scheme={scheme} tone="default">
        <SearchHeader onClose={handleClose} />
        {filtersVisible && (
          <Card borderTop style={{flexShrink: 0}}>
            <Filters />
          </Card>
        )}

        <CommandListContainer>
          {hasValidTerms ? <SearchResults onClose={handleClose} /> : <RecentSearches />}
        </CommandListContainer>
      </InnerCard>
    </SearchDialogBox>
  )
}
