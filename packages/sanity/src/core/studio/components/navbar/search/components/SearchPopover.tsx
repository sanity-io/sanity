import {Card, Portal, Theme, useClickOutside, useLayer} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled, {css} from 'styled-components'
import {useColorScheme} from '../../../../colorScheme'
import {
  POPOVER_INPUT_PADDING,
  POPOVER_MAX_HEIGHT,
  POPOVER_MAX_WIDTH,
  POPOVER_RADIUS,
} from '../constants'
import {useSearchState} from '../contexts/search/useSearchState'
import {useSearchHotkeys} from '../hooks/useSearchHotkeys'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {CommandListContainer} from './commandList/CommandListContainer'
import {CommandListProvider} from './commandList/CommandListProvider'
import {useCommandList} from './commandList/useCommandList'
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
  const isMountedRef = useRef(false)
  const [lastActiveIndex, setLastActiveIndex] = useState(-1)

  const {zIndex} = useLayer()

  const {
    dispatch,
    setOnClose,
    state: {filtersVisible, recentSearches, result, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  /**
   * Bind hotkeys to open action
   */
  useSearchHotkeys({onOpen, open})

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
          ariaActiveDescendant={itemIndices.length > 0}
          ariaChildrenLabel={hasValidTerms ? 'Search results' : 'Recent searches'}
          ariaHeaderLabel="Search results"
          autoFocus
          data-testid="search-results-popover"
          initialSelectedIndex={hasValidTerms ? lastActiveIndex : 0}
          itemIndices={itemIndices}
        >
          <SearchPopoverContent
            filtersVisible={filtersVisible}
            hasValidTerms={hasValidTerms}
            onClose={handleClose}
            open={open}
            position={position}
          />
        </CommandListProvider>
      </FocusLock>
    </Portal>
  )
}

function SearchPopoverContent({
  filtersVisible,
  hasValidTerms,
  onClose,
  open,
  position,
}: {
  filtersVisible: boolean
  hasValidTerms: boolean
  onClose: (lastActiveIndex: number) => void
  open: boolean
  position: PopoverPosition
}) {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const {isTopLayer, zIndex} = useLayer()
  const {scheme} = useColorScheme()
  const {getTopIndex} = useCommandList()

  /**
   * Store top-most search result scroll index on close
   */
  const handleClose = useCallback(() => {
    onClose(getTopIndex())
  }, [getTopIndex, onClose])

  /**
   * Check for top-most layer to prevent closing if a portalled element (i.e. menu button) is active
   */
  const handleClickOutside = useCallback(() => {
    if (open && isTopLayer) {
      handleClose()
    }
  }, [handleClose, isTopLayer, open])

  useClickOutside(handleClickOutside, [popoverElement])

  /**
   * Bind hotkeys to close action
   */
  useSearchHotkeys({onClose: handleClose, open})

  return (
    <SearchPopoverCard
      $position={position}
      overflow="hidden"
      radius={POPOVER_RADIUS}
      ref={setPopoverElement}
      scheme={scheme}
      shadow={2}
      style={{zIndex}}
    >
      <SearchHeader onClose={handleClose} />

      {filtersVisible && (
        <FiltersCard borderTop>
          <Filters />
        </FiltersCard>
      )}

      <CommandListContainer>
        {hasValidTerms ? (
          <SearchResults onClose={handleClose} />
        ) : (
          <RecentSearches showFiltersOnClick />
        )}
      </CommandListContainer>
    </SearchPopoverCard>
  )
}
