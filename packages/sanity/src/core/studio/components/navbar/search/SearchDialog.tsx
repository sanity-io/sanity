import {Box, Card, Dialog, Portal} from '@sanity/ui'
import React, {useCallback, useEffect, useId, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'
import {RecentSearches} from './components/RecentSearches'
import {SearchHeader} from './components/SearchHeader'
import {SearchResults} from './components/SearchResults'
import {TypeFilters} from './components/TypeFilters'
import {CommandListProvider} from './contexts/commandList'
import {useSearchState} from './contexts/search/useSearchState'
import {useMeasureSearchResultsIndex} from './hooks/useMeasureSearchResultsIndex'
import {useSearchHotkeys} from './hooks/useSearchHotkeys'
import {hasSearchableTerms} from './utils/hasSearchableTerms'

interface SearchDialogProps {
  onClose: () => void
  onOpen: () => void
  open: boolean
}

const DialogContentCard = styled(Card)`
  height: 100%;
`

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

const SearchContentBox = styled(Box)`
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
`

const StyledDialog = styled(Dialog)`
  [data-ui='DialogCard'] > [data-ui='Card'] {
    flex: 1;
  }
`

/**
 * @internal
 */
export function SearchDialog({onClose, onOpen, open}: SearchDialogProps) {
  const [childContainerElement, setChildContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [headerInputElement, setHeaderInputRef] = useState<HTMLInputElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayRef] = useState<HTMLDivElement | null>(null)

  const isMountedRef = useRef(false)

  const {
    dispatch,
    state: {filtersVisible, recentSearches, result, terms},
  } = useSearchState()

  const {scheme} = useColorScheme()

  const hasValidTerms = hasSearchableTerms(terms)

  /**
   * Measure top-most visible search result index
   */
  const {lastSearchIndex, resetLastSearchIndex, setLastSearchIndex} =
    useMeasureSearchResultsIndex(childContainerElement)

  /**
   * Store top-most search result scroll index on close
   */
  const handleClose = useCallback(() => {
    setLastSearchIndex()
    onClose()
  }, [onClose, setLastSearchIndex])

  /**
   * Bind hotkeys to open / close actions
   */
  useSearchHotkeys({onClose: handleClose, onOpen, open})

  /**
   * Reset last search index when new results are loaded, or visiting recent searches
   * TODO: Revise if/when we introduce pagination
   */
  useEffect(() => {
    if ((!hasValidTerms || result.loaded) && isMountedRef.current) {
      resetLastSearchIndex()
    }
  }, [hasValidTerms, resetLastSearchIndex, result.loaded])

  /**
   * Reset ordering when popover is closed (without valid search terms)
   */
  useEffect(() => {
    if (!hasValidTerms && isMountedRef.current && !open) {
      dispatch({type: 'SEARCH_ORDERING_RESET'})
    }
  }, [dispatch, hasValidTerms, open])

  /**
   * Store mounted state (must be last)
   */
  useEffect(() => {
    if (!isMountedRef?.current) {
      isMountedRef.current = true
    }
  }, [])

  const commandListId = useId()

  if (!open) {
    return null
  }

  return (
    <CommandListProvider
      ariaChildrenLabel={hasValidTerms ? 'Search results' : 'Recent searches'}
      ariaHeaderLabel="Search"
      autoFocus
      childContainerElement={childContainerElement}
      childCount={hasValidTerms ? result.hits.length : recentSearches.length}
      containerElement={containerElement}
      headerInputElement={headerInputElement}
      id={commandListId || ''}
      data-testid="search-results-dialog"
      initialSelectedIndex={hasValidTerms ? lastSearchIndex : 0}
      level={0}
      pointerOverlayElement={pointerOverlayElement}
      virtualList={hasValidTerms}
    >
      <Portal>
        <FocusLock autoFocus={false} returnFocus>
          <SearchDialogBox ref={setContainerRef}>
            <InnerCard display="flex" height="fill" scheme={scheme} tone="default">
              <SearchHeader onClose={handleClose} setHeaderInputRef={setHeaderInputRef} />
              <SearchContentBox flex={1}>
                {hasValidTerms ? (
                  <SearchResults
                    onClose={handleClose}
                    setChildContainerRef={setChildContainerRef}
                    setPointerOverlayRef={setPointerOverlayRef}
                  />
                ) : (
                  <RecentSearches
                    setChildContainerRef={setChildContainerRef}
                    setPointerOverlayRef={setPointerOverlayRef}
                  />
                )}
              </SearchContentBox>
              {filtersVisible && <SearchDialogFilters />}
            </InnerCard>
          </SearchDialogBox>
        </FocusLock>
      </Portal>
    </CommandListProvider>
  )
}

function SearchDialogFilters() {
  const {dispatch} = useSearchState()

  const handleClose = useCallback(() => {
    dispatch({type: 'FILTERS_HIDE'})
  }, [dispatch])

  return (
    <FocusLock autoFocus={false}>
      <StyledDialog
        cardRadius={1}
        header="Filter"
        height="fill"
        id="search-filter"
        onClose={handleClose}
        width={2}
      >
        <DialogContentCard tone="default">
          <TypeFilters />
        </DialogContentCard>
      </StyledDialog>
    </FocusLock>
  )
}
