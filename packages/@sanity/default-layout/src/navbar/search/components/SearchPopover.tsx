import {hues} from '@sanity/color'
import {Card, Flex, studioTheme, Theme, useClickOutside, useLayer} from '@sanity/ui'
import React, {RefObject, useCallback, useEffect, useRef, useState} from 'react'
import styled, {css} from 'styled-components'
import {useSearchState} from '../contexts/search'
import {useContainerArrowNavigation} from '../hooks/useContainerArrowNavigation'
import {SearchContent} from './SearchContent'
import {SearchHeader} from './SearchHeader'
import {TypeFilters} from './TypeFilters'

export interface PopoverProps {
  onClose: () => void
  placeholderRef: RefObject<HTMLInputElement>
}

const DIALOG_MAX_WIDTH = 800 // px
const DIALOG_SEARCH_FIELD_PADDING = 1 // Sanity UI scale

const searchFieldPaddingPx = studioTheme.space[DIALOG_SEARCH_FIELD_PADDING]

export function SearchPopover({onClose, placeholderRef}: PopoverProps) {
  const [dialogPosition, setDialogPosition] = useState(calcDialogPosition(placeholderRef))
  const [dialogEl, setDialogEl] = useState<HTMLDivElement>()

  const childContainerRef = useRef<HTMLDivElement>(null)
  const headerContainerRef = useRef<HTMLDivElement>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)

  const {zIndex} = useLayer()

  const {
    state: {result},
  } = useSearchState()

  useClickOutside(onClose, [dialogEl])

  // Re-focus header input text when a child item is clicked
  const handleChildItemClick = useCallback(() => {
    headerInputRef?.current?.focus()
  }, [])

  const handleWindowResize = useCallback(() => {
    setDialogPosition(calcDialogPosition(placeholderRef))
  }, [placeholderRef])

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleWindowResize])

  useContainerArrowNavigation(
    {childContainerRef, containerRef: headerContainerRef, onChildItemClick: handleChildItemClick},
    [result.loaded]
  )

  return (
    <>
      <Overlay style={{zIndex}} />

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
        <SearchHeader containerRef={headerContainerRef} inputRef={headerInputRef} />

        <Flex align="stretch">
          <SearchContent
            childContainerRef={childContainerRef}
            onClose={onClose}
            showFiltersOnRecentSearch
          />
          <SearchPopoverFilters />
        </Flex>
      </SearchPopoverWrapper>
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
  max-height: min(calc(100vh - ${searchFieldPaddingPx * 2}px), 700px);
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

const TypeFilterWrapper = styled(Card)`
  border-left: 1px solid ${hues.gray[100].hex};
  max-width: 250px;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
`
