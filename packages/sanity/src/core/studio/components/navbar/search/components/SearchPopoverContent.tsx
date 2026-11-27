import {type StackablePerspective} from '@sanity/client'
import {Card, Portal} from '@sanity/ui'
import {motion, type Transition, type Variants} from 'motion/react'
import {type RefObject, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {styled} from 'styled-components'

import {supportsTouch} from '../../../../../util/supportsTouch'
import {
  POPOVER_INPUT_PADDING,
  POPOVER_MAX_HEIGHT,
  POPOVER_MAX_WIDTH,
  POPOVER_RADIUS,
} from '../constants'
import {useSearchState} from '../contexts/search/useSearchState'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {Filters} from './filters/Filters'
import {RecentSearches} from './recentSearches/RecentSearches'
import {SearchHeader} from './SearchHeader'
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

const ANIMATION_TRANSITION: Transition = {
  duration: 0.4,
  type: 'spring',
}

const CARD_VARIANTS: Variants = {
  open: {opacity: 1, scale: 1, x: '-50%'},
  closed: {opacity: 0, scale: 0.99, x: '-50%'},
}

const OVERLAY_VARIANTS: Variants = {
  open: {opacity: 1},
  closed: {opacity: 0},
}

const Y_POSITION = 12 // vh

const MotionOverlay = styled(motion.create(Card))`
  background-color: var(--card-backdrop-color);
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`

const SearchMotionCard = styled(motion.create(Card))`
  display: flex !important;
  flex-direction: column;
  left: 50%;
  max-height: min(
    calc(100vh - ${Y_POSITION}vh - ${POPOVER_INPUT_PADDING}px),
    ${POPOVER_MAX_HEIGHT}px
  );
  position: absolute;
  top: ${Y_POSITION}vh;
  width: min(calc(100vw - ${POPOVER_INPUT_PADDING * 2}px), ${POPOVER_MAX_WIDTH}px);
`

/**
 * The open search popover: the search field, the filters and the results or recent searches.
 * Loaded once the popover first opens.
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

  return (
    <Portal>
      <FocusLock autoFocus={!supportsTouch} disabled={disableFocusLock} returnFocus>
        <MotionOverlay
          animate="open"
          exit="closed"
          initial="closed"
          style={{zIndex}}
          transition={ANIMATION_TRANSITION}
          variants={OVERLAY_VARIANTS}
        />

        <SearchMotionCard
          animate="open"
          exit="closed"
          initial="closed"
          overflow="hidden"
          radius={POPOVER_RADIUS}
          ref={popoverRef}
          shadow={2}
          style={{zIndex}}
          transition={ANIMATION_TRANSITION}
          variants={CARD_VARIANTS}
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
        </SearchMotionCard>
      </FocusLock>
    </Portal>
  )
}
