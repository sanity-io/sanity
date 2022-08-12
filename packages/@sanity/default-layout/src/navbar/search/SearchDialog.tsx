import {Box, Card, Dialog, Flex, Portal} from '@sanity/ui'
import React, {useCallback, useEffect, useRef} from 'react'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {RecentSearches} from './components/RecentSearches'
import {SearchHeader} from './components/SearchHeader'
import {SearchResults} from './components/SearchResults'
import {TypeFilters} from './components/TypeFilters'
import {CommandListProvider} from './contexts/commandList'
import {useSearchState} from './contexts/search'
import {hasSearchableTerms} from './contexts/search/selectors'
import {useSaveSearchIndexOnClose} from './hooks/useSaveSearchIndexOnClose'
import {useSearchHotkeys} from './hooks/useSearchHotkeys'

interface SearchDialogProps {
  onClose: () => void
  onOpen: () => void
  open: boolean
}

export function SearchDialog({onClose, onOpen, open}: SearchDialogProps) {
  const childContainerRef = useRef<HTMLDivElement>(null)
  const childContainerParentRef = useRef<HTMLDivElement>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)
  const pointerOverlayRef = useRef<HTMLDivElement>(null)

  const {
    state: {recentSearches, result, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms(terms)

  /**
   * Retrieve and retain top-most search index on close
   */
  const {savedSearchIndex, handleClose} = useSaveSearchIndexOnClose({
    childContainerRef,
    onClose,
    saveOnClose: hasValidTerms,
  })

  /**
   * Bind hotkeys to open / close actions
   */
  useSearchHotkeys({onClose: handleClose, onOpen, open})

  if (!open) {
    return null
  }

  return (
    <CommandListProvider
      childContainerRef={childContainerRef}
      childContainerParentRef={childContainerParentRef}
      childCount={hasValidTerms ? result.hits.length : recentSearches.length}
      headerInputRef={headerInputRef}
      initialIndex={savedSearchIndex}
      pointerOverlayRef={pointerOverlayRef}
      wraparound={!hasValidTerms}
    >
      <Portal>
        <FocusLock>
          <SearchDialogContentWrapper scheme="light" tone="default">
            <Flex direction="column" height="fill">
              <SearchHeader inputRef={headerInputRef} onClose={handleClose} />
              <SearchContent flex={1} ref={childContainerParentRef}>
                {hasValidTerms ? (
                  <SearchResults
                    childContainerRef={childContainerRef}
                    onClose={handleClose}
                    pointerOverlayRef={pointerOverlayRef}
                    initialSearchIndex={savedSearchIndex}
                  />
                ) : (
                  <RecentSearches
                    childContainerRef={childContainerRef}
                    pointerOverlayRef={pointerOverlayRef}
                  />
                )}
              </SearchContent>

              <SearchDialogFilters />
            </Flex>
          </SearchDialogContentWrapper>
        </FocusLock>
      </Portal>
    </CommandListProvider>
  )
}

function SearchDialogFilters() {
  const {
    dispatch,
    state: {filtersVisible},
  } = useSearchState()

  const dialogRef = useRef<HTMLDivElement>(null)

  // Always hide filters on mount
  useEffect(() => {
    dispatch({type: 'FILTERS_HIDE'})
  }, [dispatch])

  // Force dialogs to be 100% height
  // TODO: there has to be a better way to do this
  useEffect(() => {
    if (dialogRef?.current?.parentElement?.parentElement) {
      dialogRef.current.parentElement.parentElement.style.height = '100%'
    }
  }, [filtersVisible, dialogRef])

  const handleClose = useCallback(() => {
    dispatch({type: 'FILTERS_HIDE'})
  }, [dispatch])

  if (!filtersVisible) {
    return null
  }

  return (
    <FocusLock>
      <Dialog
        cardRadius={1}
        contentRef={dialogRef}
        header="Filter"
        height="fill"
        id="search-filter"
        onClose={handleClose}
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

const SearchDialogContentWrapper = styled(Card)`
  height: 100vh;
  outline: 2px solid red;
  left: 0;
  overflow: hidden;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1;
`

const SearchContent = styled(Box)`
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
`
