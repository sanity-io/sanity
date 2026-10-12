import {useSelector} from '@xstate/react'
import {useContext} from 'react'
import {SearchContext} from 'sanity/_singletons'

import {type GlobalSearchSnapshot} from './globalSearchMachine'
import {type SearchContextValue} from './SearchContext'

/**
 * @internal
 */
export function useSearchState(): SearchContextValue {
  const context = useContext(SearchContext)

  if (context === undefined) {
    throw new Error('useSearchState must be used within an SearchProvider')
  }
  return context
}

/**
 * Returns the slice of search state picked by `selector`, re-rendering only when it changes.
 */
export function useSearchSelector<T>(
  selector: (snapshot: GlobalSearchSnapshot) => T,
  compare?: (a: T, b: T) => boolean,
): T {
  const {searchActorRef} = useSearchState()
  return useSelector(searchActorRef, selector, compare)
}

/**
 * Filters are always visible in the popover. Fullscreen has a toggle to hide them.
 */
export function useSearchFiltersVisible(): boolean {
  const {fullscreen} = useSearchState()
  const filtersVisible = useSearchSelector((snapshot) => snapshot.context.filtersVisible)
  return !fullscreen || filtersVisible
}
