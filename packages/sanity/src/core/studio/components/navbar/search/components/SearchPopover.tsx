import {type StackablePerspective} from '@sanity/client'
import {useClickOutsideEvent, useLayer} from '@sanity/ui'
import {lazy, Suspense, useRef} from 'react'

import {useMountCommitted} from '../../../../../components/viewTransition/useMountCommitted'
import {useViewTransitionValue} from '../../../../../components/viewTransition/useViewTransitionValue'
import {SEARCH_POPOVER_TRANSITION} from '../constants'
import {useSearchState} from '../contexts/search/useSearchState'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {SearchWrapper} from './common/SearchWrapper'
import {type ItemSelectHandler} from './searchResults/item/SearchResultItem'

// The search field, filters and results only render while the popover is open
const SearchPopoverContent = lazy(() => import('./SearchPopoverContent'))

const SEARCH_POPOVER_TYPES = [SEARCH_POPOVER_TRANSITION]

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
   * The variant the result previews are resolved in, as a bare variant id.
   */
  previewVariant?: string
  /**
   * If provided, will trigger to open the search popover when user types hotkey + k
   */
  onOpen?: () => void
  open: boolean
}

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
  previewVariant,
  open,
}: SearchPopoverProps) {
  const popoverElement = useRef<HTMLDivElement | null>(null)

  const {isTopLayer, zIndex} = useLayer()

  const {
    onClose: onSearchClose,
    state: {terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  // `shown` lags `open` by one transition of its own type. Mounting and unmounting the content in
  // that transition is what gives the overlay and the card their view transition in and out. A
  // popover that mounts open opens a commit after its mount, which then does not insert the
  // content's boundaries (see `useMountCommitted`).
  const mountCommitted = useMountCommitted()
  const shown = useViewTransitionValue(open && mountCommitted, SEARCH_POPOVER_TYPES)

  /**
   * Check for top-most layer to prevent closing if a portalled element (i.e. menu button) is active.
   * Armed once the card is shown: until then there is no card to click inside of.
   */
  useClickOutsideEvent(isTopLayer && open && shown && !!onSearchClose && onSearchClose, () => [
    popoverElement.current,
  ])

  return (
    <SearchWrapper hasValidTerms={hasValidTerms} onClose={onClose} onOpen={onOpen} open={open}>
      {/* Mounted before the content, so the transition that opens the popover waits for the
          content's chunk instead of revealing it later, outside that transition */}
      <Suspense fallback={null}>
        {shown && (
          <SearchPopoverContent
            // The lock lets go on the urgent close: the content stays until its exit transition
            // commits, and focus goes back to where it was right away.
            disableFocusLock={disableFocusLock || !open}
            disableIntentLink={disableIntentLink}
            onClose={onClose}
            onItemSelect={onItemSelect}
            popoverRef={popoverElement}
            previewPerspective={previewPerspective}
            previewVariant={previewVariant}
            zIndex={zIndex}
          />
        )}
      </Suspense>
    </SearchWrapper>
  )
}
