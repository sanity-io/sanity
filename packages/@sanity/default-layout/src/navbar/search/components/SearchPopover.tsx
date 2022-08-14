import {hues} from '@sanity/color'
import {Box, Card, Flex, Theme, useClickOutside, useLayer} from '@sanity/ui'
import React, {useRef} from 'react'
import styled, {css} from 'styled-components'
import {POPOVER_INPUT_PADDING, POPOVER_MAX_HEIGHT, POPOVER_MAX_WIDTH} from '../constants'
import {CommandListProvider} from '../contexts/commandList'
import {useSearchState} from '../contexts/search'
import {hasSearchableTerms} from '../contexts/search/selectors'
import {RecentSearches} from './RecentSearches'
import {SearchHeader} from './SearchHeader'
import {SearchResults} from './SearchResults'
import {TypeFilters} from './TypeFilters'

type PopoverPosition = {
  x: number
  y: number
}
export interface SearchPopoverProps {
  initialSearchIndex?: number
  onClose: () => void
  position: PopoverPosition
}

export function SearchPopover({onClose, initialSearchIndex, position}: SearchPopoverProps) {
  const childContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)
  const pointerOverlayRef = useRef<HTMLDivElement>(null)

  const {zIndex} = useLayer()

  const {
    state: {recentSearches, result, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms(terms)

  useClickOutside(onClose, [containerRef.current])

  return (
    <>
      <Overlay style={{zIndex}} />

      <CommandListProvider
        childContainerRef={childContainerRef}
        childCount={hasValidTerms ? result.hits.length : recentSearches.length}
        containerRef={containerRef}
        headerInputRef={headerInputRef}
        initialIndex={initialSearchIndex}
        pointerOverlayRef={pointerOverlayRef}
        wraparound={!hasValidTerms}
        virtualList
      >
        <SearchPopoverWrapper
          $position={position}
          overflow="hidden"
          radius={2}
          ref={containerRef}
          scheme="light"
          shadow={2}
          style={{zIndex}}
        >
          <SearchHeader inputRef={headerInputRef} />

          {/* Reverse flex direction is used ensure filters are focusable before recent searches */}
          <Flex align="stretch" direction="row-reverse">
            <SearchPopoverFilters />
            <SearchContentWrapper flex={1}>
              {hasValidTerms ? (
                <SearchResults
                  childContainerRef={childContainerRef}
                  onClose={onClose}
                  pointerOverlayRef={pointerOverlayRef}
                  initialSearchIndex={initialSearchIndex}
                />
              ) : (
                <RecentSearches
                  childContainerRef={childContainerRef}
                  pointerOverlayRef={pointerOverlayRef}
                  showFiltersOnClick
                />
              )}
            </SearchContentWrapper>
          </Flex>
        </SearchPopoverWrapper>
      </CommandListProvider>
    </>
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
`

const TypeFilterWrapper = styled(Card)`
  border-left: 1px solid ${hues.gray[200].hex};
  max-width: 250px;
  width: 100%;
`
