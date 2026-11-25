import {type StackablePerspective} from '@sanity/client'
import {Card, Portal} from '@sanity/ui'
import {type RefObject, useState, ViewTransition} from 'react'
import FocusLock from 'react-focus-lock'
import {styled} from 'styled-components'

import {useViewTransitionStyles} from '../../../../../components/viewTransition/viewTransitionStyles'
import {supportsTouch} from '../../../../../util/supportsTouch'
import {studioViewTransitionClass} from '../../../../../viewTransitions/transitionTypes'
import {
  POPOVER_INPUT_PADDING,
  POPOVER_MAX_HEIGHT,
  POPOVER_MAX_WIDTH,
  POPOVER_RADIUS,
  SEARCH_POPOVER_TRANSITION,
} from '../constants'
import {useSearchState} from '../contexts/search/useSearchState'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {Filters} from './filters/Filters'
import {RecentSearches} from './recentSearches/RecentSearches'
import {SearchHeader} from './SearchHeader'
import {searchCardFocusLock} from './SearchPopoverContent.css'
import {type ItemSelectHandler} from './searchResults/item/SearchResultItem'
import {SearchResults} from './searchResults/SearchResults'

interface SearchPopoverContentProps {
  disableFocusLock?: boolean
  disableIntentLink?: boolean
  onClose: () => void
  onItemSelect?: ItemSelectHandler
  popoverRef: RefObject<HTMLDivElement | null>
  previewPerspective?: StackablePerspective[]
  previewVariant?: string
  zIndex: number
}

const Y_POSITION = 12 // vh

const OVERLAY_FADE = studioViewTransitionClass({
  default: 'none',
  [SEARCH_POPOVER_TRANSITION]: 'sanity-vt-fade',
})
const CARD_POP = studioViewTransitionClass({
  default: 'none',
  [SEARCH_POPOVER_TRANSITION]: 'sanity-vt-pop',
})

const Overlay = styled(Card)`
  background-color: var(--card-backdrop-color);
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`

const SearchCard = styled(Card)`
  display: flex !important;
  flex-direction: column;
  left: 50%;
  max-height: min(
    calc(100vh - ${Y_POSITION}vh - ${POPOVER_INPUT_PADDING}px),
    ${POPOVER_MAX_HEIGHT}px
  );
  position: absolute;
  top: ${Y_POSITION}vh;
  transform: translateX(-50%);
  width: min(calc(100vw - ${POPOVER_INPUT_PADDING * 2}px), ${POPOVER_MAX_WIDTH}px);
`

/**
 * The open search popover: the search field, the filters and the results or recent searches.
 * Loaded once the popover first opens. The overlay fades and the card pops in and out as view
 * transitions when `SearchPopover` mounts and unmounts it.
 */
export default function SearchPopoverContent({
  disableFocusLock,
  disableIntentLink,
  onClose,
  onItemSelect,
  popoverRef,
  previewPerspective,
  previewVariant,
  zIndex,
}: SearchPopoverContentProps) {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)

  const {
    state: {filtersVisible, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})
  useViewTransitionStyles()

  // React only animates a `<ViewTransition>` in and out when no element above it mounts or
  // unmounts in the same commit, so the boundaries come first in the portal and the focus lock's
  // element sits inside the card.
  return (
    <Portal>
      <ViewTransition default={OVERLAY_FADE}>
        <Overlay style={{zIndex}} />
      </ViewTransition>

      <ViewTransition default={CARD_POP}>
        <SearchCard
          overflow="hidden"
          radius={POPOVER_RADIUS}
          ref={popoverRef}
          shadow={2}
          style={{zIndex}}
        >
          <FocusLock
            autoFocus={!supportsTouch}
            className={searchCardFocusLock}
            disabled={disableFocusLock}
            returnFocus
          >
            <SearchHeader onClose={onClose} ref={setInputElement} />
            {filtersVisible && (
              <Card borderTop flex="none">
                <Filters />
              </Card>
            )}
            {hasValidTerms ? (
              <SearchResults
                inputElement={inputElement}
                onItemSelect={onItemSelect}
                disableIntentLink={disableIntentLink}
                previewPerspective={previewPerspective}
                previewVariant={previewVariant}
              />
            ) : (
              <RecentSearches inputElement={inputElement} />
            )}
          </FocusLock>
        </SearchCard>
      </ViewTransition>
    </Portal>
  )
}
