import {hues} from '@sanity/color'
import {Box, Card, Dialog, Flex, Portal} from '@sanity/ui'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {RecentSearches} from './components/RecentSearches'
import {SearchHeader} from './components/SearchHeader'
import {SearchResults} from './components/SearchResults'
import {TypeFilters} from './components/TypeFilters'
import {CommandListProvider} from './contexts/commandList'
import {useSearchState} from './contexts/search'
import {hasSearchableTerms} from './contexts/search/selectors'
import {useMeasureSearchResultsIndex} from './hooks/useMeasureSearchResultsIndex'
import {useSearchHotkeys} from './hooks/useSearchHotkeys'

interface SearchDialogProps {
  onClose: () => void
  onOpen: () => void
  open: boolean
}

const ID = 'search-results-dialog'

export function SearchDialog({onClose, onOpen, open}: SearchDialogProps) {
  const [childContainerElement, setChildContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [headerInputElement, setHeaderInputRef] = useState<HTMLInputElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayRef] = useState<HTMLDivElement | null>(null)

  const isMountedRef = useRef(false)

  const {
    state: {filtersVisible, recentSearches, result, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms(terms)

  /**
   * Measure top-most visible search result index
   */
  const {lastSearchIndex, resetLastSearchIndex, setLastSearchIndex} = useMeasureSearchResultsIndex(
    childContainerElement
  )

  /**
   * Reset last search index when new results are loaded, or visiting recent searches
   * @todo Revise if/when we introduce pagination
   */
  useEffect(() => {
    if (!isMountedRef?.current) {
      isMountedRef.current = true
      return
    }

    if (!hasValidTerms || result.loaded) {
      resetLastSearchIndex()
    }
  }, [hasValidTerms, resetLastSearchIndex, result.loaded])

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
      id={ID}
      initialSelectedIndex={hasValidTerms ? lastSearchIndex : 0}
      pointerOverlayElement={pointerOverlayElement}
      virtualList={hasValidTerms}
    >
      <Portal>
        <FocusLock autoFocus={false} returnFocus>
          <SearchDialogWrapper ref={setContainerRef} scheme="light" tone="default">
            <Flex direction="column" height="fill">
              <SearchHeader onClose={handleClose} setHeaderInputRef={setHeaderInputRef} />
              <SearchContent flex={1}>
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
              </SearchContent>

              {filtersVisible && <SearchDialogFilters />}
            </Flex>
          </SearchDialogWrapper>
        </FocusLock>
      </Portal>
    </CommandListProvider>
  )
}

function SearchDialogFilters() {
  const {dispatch} = useSearchState()

  const [dialogElement, setDialogRef] = useState<HTMLDivElement | null>(null)

  /**
   * Force dialog content to be 100% height
   */
  useEffect(() => {
    const dialogCardInnerElement = dialogElement?.querySelector(
      '[data-ui="DialogCard"] > [data-ui="Card"]'
    ) as HTMLElement
    if (dialogCardInnerElement) {
      dialogCardInnerElement.style.flex = '1'
    }
  }, [dialogElement])

  const handleClose = useCallback(() => {
    dispatch({type: 'FILTERS_HIDE'})
  }, [dispatch])

  return (
    <FocusLock autoFocus={false}>
      <Dialog
        cardRadius={1}
        header="Filter"
        height="fill"
        id="search-filter"
        onClose={handleClose}
        ref={setDialogRef}
        width={2}
      >
        <DialogContent tone="default">
          <TypeFilters />
        </DialogContent>
      </Dialog>
    </FocusLock>
  )
}

const DialogContent = styled(Card)`
  height: 100%;
`

const SearchDialogWrapper = styled(Card)`
  height: 100vh;
  left: 0;
  overflow: hidden;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1;

  &[data-focused='true'],
  &[data-hovered='true'] {
    #${ID}-children {
      button[aria-selected='true'],
      [aria-selected='true'] a {
        background: ${hues.gray[50].hex};
        // Disable box-shadow to hide the halo effect when we have keyboard focus over a selected <Button>
        box-shadow: none;
      }
    }
  }
`

const SearchContent = styled(Box)`
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
`
