import {Card, Flex, Portal, Theme, useClickOutside, useLayer} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled, {css} from 'styled-components'
import {useColorScheme} from '../../../../colorScheme'
import {POPOVER_INPUT_PADDING, POPOVER_MAX_HEIGHT, POPOVER_MAX_WIDTH} from '../constants'
import {CommandListProvider} from '../contexts/commandList'
import {useSearchState} from '../contexts/search/useSearchState'
import {useMeasureSearchResultsIndex} from '../hooks/useMeasureSearchResultsIndex'
import {useSearchHotkeys} from '../hooks/useSearchHotkeys'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {Filters} from './filters/Filters'
import {RecentSearches} from './recentSearches/RecentSearches'
import {SearchHeader} from './SearchHeader'
import {SearchResults} from './searchResults/SearchResults'

export type PopoverPosition = {
  x: number | null
  y: number
}
export interface SearchPopoverProps {
  disableFocusLock?: boolean
  onClose: () => void
  onOpen: () => void
  open: boolean
  position: PopoverPosition
}

const FiltersCard = styled(Card)`
  flex-shrink: 0;
`

const Overlay = styled.div`
  background-color: ${({theme}: {theme: Theme}) => theme.sanity.color.base.shadow.ambient};
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
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

export function SearchPopover({
  disableFocusLock,
  onClose,
  onOpen,
  open,
  position,
}: SearchPopoverProps) {
  const [childContainerElement, setChildContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [headerInputElement, setHeaderInputRef] = useState<HTMLInputElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayRef] = useState<HTMLDivElement | null>(null)

  const isMountedRef = useRef(false)

  const {isTopLayer, zIndex} = useLayer()
  const {scheme} = useColorScheme()

  const {
    dispatch,
    setOnClose,
    state: {filtersVisible, recentSearches, result, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

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
   * Store mounted state (must be last)
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
      <FocusLock autoFocus={false} disabled={disableFocusLock} returnFocus>
        <Overlay style={{zIndex}} />

        <CommandListProvider
          ariaChildrenLabel={hasValidTerms ? 'Search results' : 'Recent searches'}
          ariaHeaderLabel="Search results"
          autoFocus
          childContainerElement={childContainerElement}
          containerElement={containerElement}
          data-testid="search-results-popover"
          headerInputElement={headerInputElement}
          initialSelectedIndex={hasValidTerms ? lastSearchIndex : 0}
          itemIndices={itemIndices}
          pointerOverlayElement={pointerOverlayElement}
        >
          <SearchPopoverCard
            $position={position}
            overflow="hidden"
            radius={2}
            ref={setContainerRef}
            scheme={scheme}
            shadow={2}
            style={{zIndex}}
          >
            <SearchHeader onClose={handleClose} setHeaderInputRef={setHeaderInputRef} />

            {filtersVisible && (
              <FiltersCard borderTop>
                <Filters />
              </FiltersCard>
            )}

            <Flex align="stretch" direction="row-reverse">
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
                  onClear={handleClearRecentSearches}
                  showFiltersOnClick
                />
              )}
            </Flex>
          </SearchPopoverCard>
        </CommandListProvider>
      </FocusLock>
    </Portal>
  )
}
