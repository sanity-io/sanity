import {Box, Card, Flex, Portal, Theme, useClickOutside, useLayer} from '@sanity/ui'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled, {css} from 'styled-components'
import {useId} from '@reach/auto-id'
import {POPOVER_INPUT_PADDING, POPOVER_MAX_HEIGHT, POPOVER_MAX_WIDTH} from '../constants'
import {CommandListProvider} from '../contexts/commandList'
import {useSearchState} from '../contexts/search'
import {hasSearchableTerms} from '../contexts/search/selectors'
import {useMeasureSearchResultsIndex} from '../hooks/useMeasureSearchResultsIndex'
import {useSearchHotkeys} from '../hooks/useSearchHotkeys'
import {RecentSearches} from './RecentSearches'
import {SearchHeader} from './SearchHeader'
import {SearchResults} from './SearchResults'
import {TypeFilters} from './TypeFilters'

type PopoverPosition = {
  x: number
  y: number
}
export interface SearchPopoverProps {
  onClose: () => void
  onOpen: () => void
  open: boolean
  position: PopoverPosition
}

const Overlay = styled.div`
  background-color: ${({theme}: {theme: Theme}) => theme.sanity.color.base.shadow.ambient};
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`

const SearchContentBox = styled(Box)`
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
`

const SearchPopoverCard = styled(Card)<{$position: PopoverPosition}>`
  ${({$position}) =>
    $position.x
      ? css`
          left: ${$position.x}px;
        `
      : css`
          left: 50%;
          transform: translateX(-50%);
        `}
  display: flex !important;
  flex-direction: column;
  max-height: ${({$position}) =>
    `min(calc(100vh - ${$position.y}px - ${POPOVER_INPUT_PADDING}px), ${POPOVER_MAX_HEIGHT}px)`};
  position: absolute;
  top: ${({$position}) => $position.y}px;
  width: min(calc(100vw - ${POPOVER_INPUT_PADDING * 2}px), ${POPOVER_MAX_WIDTH}px);
`

const TypeFilterCard = styled(Card)`
  border-left: 1px solid ${({theme}) => theme.sanity.color.base.border};
  max-width: 250px;
  width: 100%;
`

export function SearchPopover({onClose, onOpen, open, position}: SearchPopoverProps) {
  const [childContainerElement, setChildContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [headerInputElement, setHeaderInputRef] = useState<HTMLInputElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayRef] = useState<HTMLDivElement | null>(null)

  const isMountedRef = useRef(false)

  const {isTopLayer, zIndex} = useLayer()

  const {
    state: {recentSearches, result, terms},
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

  const handleClearRecentSearches = useCallback(() => {
    headerInputElement?.focus()
  }, [headerInputElement])

  /**
   * Check for top-most layer to prevent closing if a portalled element (i.e. menu button) is active
   */
  const handleClickOutside = useCallback(() => {
    if (open && isTopLayer) {
      handleClose()
    }
  }, [handleClose, isTopLayer, open])

  /**
   * Bind hotkeys to open / close actions
   */
  useSearchHotkeys({onClose: handleClose, onOpen, open})

  useClickOutside(handleClickOutside, [containerElement])

  const dialogId = useId()

  if (!open) {
    return null
  }

  return (
    <Portal>
      <FocusLock autoFocus={false} returnFocus>
        <Overlay style={{zIndex}} />

        <CommandListProvider
          ariaChildrenLabel={hasValidTerms ? 'Search results' : 'Recent searches'}
          ariaHeaderLabel="Search results"
          autoFocus
          childContainerElement={childContainerElement}
          childCount={hasValidTerms ? result.hits.length : recentSearches.length}
          containerElement={containerElement}
          headerInputElement={headerInputElement}
          id={dialogId}
          data-testid="search-results-popover"
          initialSelectedIndex={hasValidTerms ? lastSearchIndex : 0}
          level={0}
          pointerOverlayElement={pointerOverlayElement}
          virtualList={hasValidTerms}
        >
          <SearchPopoverCard
            $position={position}
            overflow="hidden"
            radius={2}
            ref={setContainerRef}
            scheme="light"
            shadow={2}
            style={{zIndex}}
          >
            <SearchHeader setHeaderInputRef={setHeaderInputRef} />

            {/* Reverse flex direction is used to ensure filters are focusable before recent searches */}
            <Flex align="stretch" direction="row-reverse">
              <SearchPopoverFilters />
              <SearchContentBox flex={1}>
                {hasValidTerms ? (
                  <SearchResults
                    onClose={handleClose}
                    setChildContainerRef={setChildContainerRef}
                    setPointerOverlayRef={setPointerOverlayRef}
                    small
                  />
                ) : (
                  <RecentSearches
                    setChildContainerRef={setChildContainerRef}
                    setPointerOverlayRef={setPointerOverlayRef}
                    onClear={handleClearRecentSearches}
                    showFiltersOnClick
                  />
                )}
              </SearchContentBox>
            </Flex>
          </SearchPopoverCard>
        </CommandListProvider>
      </FocusLock>
    </Portal>
  )
}

function SearchPopoverFilters() {
  const {
    state: {filtersVisible},
  } = useSearchState()

  if (!filtersVisible) {
    return null
  }

  return (
    <TypeFilterCard tone="transparent">
      <TypeFilters small />
    </TypeFilterCard>
  )
}
