import {type StackablePerspective} from '@sanity/client'
import {Card, Portal, useClickOutsideEvent, useLayer} from '@sanity/ui'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {styled} from 'styled-components'

import {supportsTouch} from '../../../../../util'
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
import {type ItemSelectHandler} from './searchResults/item/SearchResultItem'
import {SearchResults} from './searchResults/SearchResults'

/**
 * @internal
 */
export interface SearchPopoverProps {
  disableFocusLock?: boolean
  disableIntentLink?: boolean
  onClose: () => void
  onItemSelect?: ItemSelectHandler
  previewPerspective?: StackablePerspective[]
  /**
   * If provided, will trigger to open the search popover when user types hotkey + k
   */
  onOpen?: () => void
  open: boolean
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
 * @internal
 */
export function SearchPopover({
  disableFocusLock,
  disableIntentLink,
  onClose,
  onItemSelect,
  onOpen,
  previewPerspective,
  open,
}: SearchPopoverProps) {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)

  const popoverElement = useRef<HTMLDivElement | null>(null)

  const {isTopLayer, zIndex} = useLayer()

  const {
    onClose: onSearchClose,
    state: {filtersVisible, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  /**
   * Check for top-most layer to prevent closing if a portalled element (i.e. menu button) is active
   */
  useClickOutsideEvent(isTopLayer && open && !!onSearchClose && onSearchClose, () => [
    popoverElement.current,
  ])

  return (
    <SearchWrapper hasValidTerms={hasValidTerms} onClose={onClose} onOpen={onOpen} open={open}>
      <AnimatePresence>
        {open && (
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
                ref={popoverElement}
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
                  />
                ) : (
                  <RecentSearches inputElement={inputElement} />
                )}
              </SearchMotionCard>
            </FocusLock>
          </Portal>
        )}
      </AnimatePresence>
    </SearchWrapper>
  )
}
