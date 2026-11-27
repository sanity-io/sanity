import {type StackablePerspective} from '@sanity/client'
import {useClickOutsideEvent, useLayer} from '@sanity/ui'
import {AnimatePresence} from 'motion/react'
import {lazy, Suspense, useRef} from 'react'

import {useSearchState} from '../contexts/search/useSearchState'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {SearchWrapper} from './common/SearchWrapper'
import {type ItemSelectHandler} from './searchResults/item/SearchResultItem'

// The search field, filters and results only render while the popover is open
const SearchPopoverContent = lazy(() => import('./SearchPopoverContent'))

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
          <Suspense fallback={null}>
            <SearchPopoverContent
              disableFocusLock={disableFocusLock}
              disableIntentLink={disableIntentLink}
              onClose={onClose}
              onItemSelect={onItemSelect}
              popoverRef={popoverElement}
              previewPerspective={previewPerspective}
              previewVariant={previewVariant}
              zIndex={zIndex}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </SearchWrapper>
  )
}
