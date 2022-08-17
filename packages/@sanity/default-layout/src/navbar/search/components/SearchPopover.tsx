import {hues} from '@sanity/color'
import {Box, Card, Flex, Portal, Theme, useClickOutside, useLayer} from '@sanity/ui'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled, {css} from 'styled-components'
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

const ID = 'search-results-popover'

export function SearchPopover({onClose, onOpen, open, position}: SearchPopoverProps) {
  const [childContainerElement, setChildContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [headerInputElement, setHeaderInputRef] = useState<HTMLInputElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayRef] = useState<HTMLDivElement | null>(null)

  const isMountedRef = useRef(false)

  const {zIndex} = useLayer()

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

  /**
   * Bind hotkeys to open / close actions
   */
  useSearchHotkeys({onClose: handleClose, onOpen, open})

  useClickOutside(handleClose, [containerElement])

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
          id={ID}
          initialSelectedIndex={hasValidTerms ? lastSearchIndex : 0}
          pointerOverlayElement={pointerOverlayElement}
          virtualList={hasValidTerms}
        >
          <SearchPopoverWrapper
            $position={position}
            overflow="hidden"
            radius={2}
            ref={setContainerRef}
            scheme="light"
            shadow={2}
            style={{zIndex}}
          >
            <SearchHeader setHeaderInputRef={setHeaderInputRef} />

            {/* Reverse flex direction is used ensure filters are focusable before recent searches */}
            <Flex align="stretch" direction="row-reverse">
              <SearchPopoverFilters />
              <SearchContentWrapper flex={1}>
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
                    showFiltersOnClick
                  />
                )}
              </SearchContentWrapper>
            </Flex>
          </SearchPopoverWrapper>
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
    <TypeFilterWrapper tone="transparent">
      <TypeFilters small />
    </TypeFilterWrapper>
  )
}

const Overlay = styled.div`
  background-color: ${({theme}: {theme: Theme}) => theme.sanity.color.base.shadow.ambient};
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`

const SearchContentWrapper = styled(Box)`
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
`

const SearchPopoverWrapper = styled(Card)<{$position: PopoverPosition}>`
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
  max-height: min(calc(100vh - ${POPOVER_INPUT_PADDING * 2}px), ${POPOVER_MAX_HEIGHT}px);
  position: absolute;
  top: ${({$position}) => $position.y}px;
  width: min(calc(100vw - ${POPOVER_INPUT_PADDING * 2}px), ${POPOVER_MAX_WIDTH}px);

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

const TypeFilterWrapper = styled(Card)`
  border-left: 1px solid ${hues.gray[200].hex};
  max-width: 250px;
  width: 100%;
`
