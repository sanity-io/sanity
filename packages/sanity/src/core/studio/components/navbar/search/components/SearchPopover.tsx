import {Card, Flex, Portal, Theme, useClickOutside, useLayer} from '@sanity/ui'
import React, {useCallback, useEffect, useId, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled, {css} from 'styled-components'
import {useColorScheme} from '../../../../colorScheme'
import {
  DEBUG_MODE,
  POPOVER_INPUT_PADDING,
  POPOVER_MAX_HEIGHT,
  POPOVER_MAX_WIDTH,
} from '../constants'
import {CommandListProvider} from '../contexts/commandList'
import {useSearchState} from '../contexts/search/useSearchState'
import {useMeasureSearchResultsIndex} from '../hooks/useMeasureSearchResultsIndex'
import {useSearchHotkeys} from '../hooks/useSearchHotkeys'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {DebugDocumentTypes} from './filters/debug/_DebugDocumentTypes'
import {DebugFilterQuery} from './filters/debug/_DebugFilterQuery'
import {Filters} from './filters/Filters'
import {RecentSearches} from './recentSearches/RecentSearches'
import {SearchHeader} from './SearchHeader'
import {SearchResults} from './SearchResults'

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

const Overlay = styled.div`
  background-color: ${({theme}: {theme: Theme}) => theme.sanity.color.base.shadow.ambient};
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`

const SearchContentCard = styled(Card)`
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
    state: {filtersVisible, recentSearches, result, terms},
  } = useSearchState()

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
    <Portal>
      <FocusLock autoFocus={false} disabled={disableFocusLock} returnFocus>
        <Overlay style={{zIndex}} />

        <CommandListProvider
          ariaChildrenLabel={hasValidTerms ? 'Search results' : 'Recent searches'}
          ariaHeaderLabel="Search results"
          autoFocus
          childContainerElement={childContainerElement}
          childCount={hasValidTerms ? result.hits.length : recentSearches?.length}
          containerElement={containerElement}
          headerInputElement={headerInputElement}
          id={commandListId || ''}
          data-testid="search-results-popover"
          initialSelectedIndex={hasValidTerms ? lastSearchIndex : 0}
          pointerOverlayElement={pointerOverlayElement}
          virtualList={hasValidTerms}
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
            <SearchHeader setHeaderInputRef={setHeaderInputRef} />

            {filtersVisible && (
              <Card
                borderBottom
                borderTop
                // TODO: create styled component
                style={{flexShrink: 0}}
              >
                <Filters />

                {/* Debug panels */}
                {DEBUG_MODE && (
                  <>
                    <DebugFilterQuery />
                    <DebugDocumentTypes />
                  </>
                )}
              </Card>
            )}

            <Flex align="stretch" direction="row-reverse">
              <SearchContentCard borderTop={!filtersVisible} flex={1}>
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
              </SearchContentCard>
            </Flex>
          </SearchPopoverCard>
        </CommandListProvider>
      </FocusLock>
    </Portal>
  )
}
