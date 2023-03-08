import {Card, Flex, Portal, Theme, useClickOutside, useLayer} from '@sanity/ui'
import React, {ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled, {css} from 'styled-components'
import {useCommandList} from '../../../../../components'
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
import {Filters} from './filters/Filters'
import {RecentSearches} from './recentSearches/RecentSearches'
import {SearchHeader} from './SearchHeader'
import {SearchResults} from './searchResults/SearchResults'
import {SharedCommandList} from './common/SharedCommandList'

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

  const {zIndex} = useLayer()

  const {
    dispatch,
    setOnClose,
    state: {filtersVisible, lastActiveIndex, result, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  /**
   * Bind hotkeys to open action
   */
  useSearchHotkeys({onOpen, open})

  /**
   * Set shared `onClose` in search context
   */
  useEffect(() => {
    setOnClose(onClose)
  }, [onClose, setOnClose])

  /**
   * Reset last search index when new results are loaded, or visiting recent searches
   */
  // @todo Revise if/when we introduce pagination
  useEffect(() => {
    if ((!hasValidTerms || result.loaded) && isMountedRef.current) {
      dispatch({index: 0, type: 'LAST_ACTIVE_INDEX_SET'})
    }
  }, [dispatch, hasValidTerms, result.loaded])

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

  if (!open) {
    return null
  }

  return (
    <Portal>
      <FocusLock autoFocus={false} disabled={disableFocusLock} returnFocus>
        <Overlay style={{zIndex}} />

        <SharedCommandList hasValidTerms={hasValidTerms} initialIndex={lastActiveIndex}>
          <SearchPopoverContent
            filtersVisible={filtersVisible}
            onClose={onClose}
            position={position}
          >
            {hasValidTerms ? <SearchResults /> : <RecentSearches />}
          </SearchPopoverContent>
        </SharedCommandList>
      </FocusLock>
    </Portal>
  )
}

function SearchPopoverContent({
  children,
  filtersVisible,
  onClose,
  position,
}: {
  children?: ReactNode
  filtersVisible: boolean
  onClose: () => void
  position: PopoverPosition
}) {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const {isTopLayer, zIndex} = useLayer()
  const {scheme} = useColorScheme()
  const {getTopIndex} = useCommandList()
  const {dispatch} = useSearchState()

  const handleClose = useCallback(() => {
    dispatch({index: getTopIndex(), type: 'LAST_ACTIVE_INDEX_SET'})
    onClose()
  }, [dispatch, getTopIndex, onClose])

  /**
   * Check for top-most layer to prevent closing if a portalled element (i.e. menu button) is active
   */
  const handleClickOutside = useCallback(() => {
    if (isTopLayer) {
      handleClose()
    }
  }, [handleClose, isTopLayer])

  useClickOutside(handleClickOutside, [popoverElement])

  /**
   * Bind hotkeys to close action
   */
  useSearchHotkeys({onClose: handleClose, open: true})

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
      {<SearchHeader onClose={handleClose} />}
      {filtersVisible && (
        <Card borderTop flex="none">
          <Filters />
        </Card>
      )}
      <Flex>{children}</Flex>
    </SearchPopoverCard>
  )
}
