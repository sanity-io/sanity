import {Card, Portal, Theme, useClickOutside, useLayer} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {supportsTouch} from '../../../../../util'
import {useColorScheme} from '../../../../colorScheme'
import {
  POPOVER_INPUT_PADDING,
  POPOVER_MAX_HEIGHT,
  POPOVER_MAX_WIDTH,
  POPOVER_RADIUS,
} from '../constants'
import {useSearchState} from '../contexts/search/useSearchState'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {SearchWrapper} from './common/SearchWrapper'
import {Filters} from './filters/Filters'
import {RecentSearches} from './recentSearches/RecentSearches'
import {SearchHeader} from './SearchHeader'
import {SearchResults} from './searchResults/SearchResults'

export interface SearchPopoverProps {
  disableFocusLock?: boolean
  onClose: () => void
  onOpen: () => void
  open: boolean
}

const Y_POSITION = 8 // px

const Overlay = styled.div`
  background-color: ${({theme}: {theme: Theme}) => theme.sanity.color.base.shadow.ambient};
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`

const SearchPopoverCard = styled(Card)`
  display: flex !important;
  flex-direction: column;
  left: 50%;
  max-height: min(
    calc(100vh - ${Y_POSITION}px - ${POPOVER_INPUT_PADDING}px),
    ${POPOVER_MAX_HEIGHT}px
  );
  position: absolute;
  top: ${Y_POSITION}px;
  transform: translateX(-50%);
  width: min(calc(100vw - ${POPOVER_INPUT_PADDING * 2}px), ${POPOVER_MAX_WIDTH}px);
`

export function SearchPopover({disableFocusLock, onClose, onOpen, open}: SearchPopoverProps) {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)

  const {isTopLayer, zIndex} = useLayer()
  const {scheme} = useColorScheme()

  const {
    onClose: onSearchClose,
    state: {filtersVisible, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  /**
   * Check for top-most layer to prevent closing if a portalled element (i.e. menu button) is active
   */
  const handleClickOutside = useCallback(() => {
    if (isTopLayer && onSearchClose && open) {
      onSearchClose()
    }
  }, [isTopLayer, onSearchClose, open])

  useClickOutside(handleClickOutside, [popoverElement])

  return (
    <SearchWrapper hasValidTerms={hasValidTerms} onClose={onClose} onOpen={onOpen} open={open}>
      <Portal>
        <FocusLock autoFocus={!supportsTouch} disabled={disableFocusLock} returnFocus>
          <Overlay style={{zIndex}} />

          <SearchPopoverCard
            overflow="hidden"
            radius={POPOVER_RADIUS}
            ref={setPopoverElement}
            scheme={scheme}
            shadow={2}
            style={{zIndex}}
          >
            <SearchHeader
              ariaInputLabel={hasValidTerms ? 'Search results' : 'Recent searches'}
              onClose={onClose}
              ref={setInputElement}
            />
            {filtersVisible && (
              <Card borderTop flex="none">
                <Filters />
              </Card>
            )}
            {hasValidTerms ? (
              <SearchResults inputElement={inputElement} />
            ) : (
              <RecentSearches inputElement={inputElement} />
            )}
          </SearchPopoverCard>
        </FocusLock>
      </Portal>
    </SearchWrapper>
  )
}
