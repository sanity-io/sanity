import {hues} from '@sanity/color'
import {Box, Card, Flex, studioTheme, Theme, useClickOutside, useLayer} from '@sanity/ui'
import React, {RefObject, useCallback, useEffect, useRef, useState} from 'react'
import styled, {css} from 'styled-components'
import {CommandListProvider} from '../contexts/commandList'
import {useSearchState} from '../contexts/search'
import {hasSearchableTerms} from '../contexts/search/selectors'
import {RecentSearches} from './RecentSearches'
import {SearchHeader} from './SearchHeader'
import {SearchResults} from './SearchResults'
import {TypeFilters} from './TypeFilters'

export interface PopoverProps {
  childContainerRef: RefObject<HTMLDivElement>
  initialSearchIndex?: number
  onClose: () => void
  placeholderRef: RefObject<HTMLInputElement>
}

const DIALOG_MAX_WIDTH = 800 // px
const DIALOG_SEARCH_FIELD_PADDING = 1 // Sanity UI scale

const searchFieldPaddingPx = studioTheme.space[DIALOG_SEARCH_FIELD_PADDING]

export function SearchPopover({
  childContainerRef,
  onClose,
  placeholderRef,
  initialSearchIndex,
}: PopoverProps) {
  const [dialogPosition, setDialogPosition] = useState(calcDialogPosition(placeholderRef))
  const [dialogEl, setDialogEl] = useState<HTMLDivElement>()

  const childContainerParentRef = useRef<HTMLDivElement>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)
  const pointerOverlayRef = useRef<HTMLDivElement>(null)

  const {zIndex} = useLayer()

  const {
    state: {recentSearches, result, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms(terms)

  useClickOutside(onClose, [dialogEl])

  const handleWindowResize = useCallback(() => {
    setDialogPosition(calcDialogPosition(placeholderRef))
  }, [placeholderRef])

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleWindowResize])

  return (
    <>
      <Overlay style={{zIndex}} />

      <CommandListProvider
        childContainerRef={childContainerRef}
        childContainerParentRef={childContainerParentRef}
        childCount={hasValidTerms ? result.hits.length : recentSearches.length}
        headerInputRef={headerInputRef}
        initialIndex={initialSearchIndex}
        pointerOverlayRef={pointerOverlayRef}
        wraparound={!hasValidTerms}
        virtualList
      >
        <SearchPopoverWrapper
          data-ui="search-dialog"
          overflow="hidden"
          radius={2}
          ref={setDialogEl}
          scheme="light"
          shadow={2}
          style={{zIndex}}
          x={dialogPosition.x}
          y={dialogPosition.y}
        >
          <SearchHeader inputRef={headerInputRef} />

          {/* Reverse flex direction is used ensure filters are focusable before recent searches */}
          <Flex align="stretch" direction="row-reverse">
            <SearchPopoverFilters />
            <SearchContentWrapper flex={1} ref={childContainerParentRef}>
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

function calcDialogPosition(
  ref: RefObject<HTMLInputElement>
): {
  x: number | null
  y: number
} {
  const placeholderRect = ref.current.getBoundingClientRect()

  // Offset positioning to account for dialog padding. This should ensure that our dialog search input
  // sits directly over the top of the placeholder.
  return {
    x:
      window.innerWidth - placeholderRect.x > DIALOG_MAX_WIDTH
        ? placeholderRect.x - searchFieldPaddingPx
        : null,
    y: placeholderRect.y - searchFieldPaddingPx,
  }
}

const SearchPopoverWrapper = styled(Card)<{x: number | null; y: number}>`
  ${(props) =>
    props.x
      ? css`
          left: ${props.x}px;
        `
      : css`
          left: 50%;
          transform: translateX(-50%);
        `}
  display: flex !important;
  flex-direction: column;
  max-height: min(calc(100vh - ${searchFieldPaddingPx * 2}px), 735px);
  position: absolute;
  top: ${(props) => props.y}px;
  width: min(calc(100vw - ${searchFieldPaddingPx * 2}px), ${DIALOG_MAX_WIDTH}px);
`

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

const TypeFilterWrapper = styled(Card)`
  border-left: 1px solid ${hues.gray[200].hex};
  max-width: 250px;
  width: 100%;
`
