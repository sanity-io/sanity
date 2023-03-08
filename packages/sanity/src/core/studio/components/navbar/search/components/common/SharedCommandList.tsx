import React, {ReactNode, useMemo} from 'react'
import {CommandListProvider, CommandListVirtualItemValue} from '../../../../../../components'
import {WeightedHit} from '../../../../../../search'
import {useSearchState} from '../../contexts/search/useSearchState'
import {RecentSearch} from '../../datastores/recentSearches'
import {RecentSearchVirtualItem} from '../recentSearches/RecentSearchVirtualItem'
import {SearchResultVirtualItem} from '../searchResults/SearchResultVirtualItem'

export const VIRTUAL_LIST_SEARCH_RESULT_ITEM_HEIGHT = 59 // px
export const VIRTUAL_LIST_RECENT_SEARCH_ITEM_HEIGHT = 36 // px
export const VIRTUAL_LIST_OVERSCAN = 4

interface SharedCommandListProps {
  children?: ReactNode
  hasValidTerms: boolean
  initialIndex: number
}

/**
 * A shared component which conditionally renders either a CommandListProvider for either
 * search results OR recent search.
 *
 * We use a shared component due to the current layout of global search, which requires children
 * to remain consistent when switching between modes. Specifically, we don't want the filter bar
 * to unmount / remount when adding document types.
 *
 * @internal
 */
export function SharedCommandList({children, hasValidTerms, initialIndex}: SharedCommandListProps) {
  const {
    state: {recentSearches, result},
  } = useSearchState()

  const values: CommandListVirtualItemValue<RecentSearch | WeightedHit>[] = useMemo(() => {
    if (hasValidTerms) {
      return result.hits.map((i) => ({value: i}))
    }

    return recentSearches.map((i) => ({value: i}))
  }, [hasValidTerms, recentSearches, result.hits])

  return (
    <CommandListProvider
      activeItemDataAttr="data-hovered"
      ariaChildrenLabel={hasValidTerms ? 'Search results' : 'Recent searches'}
      ariaInputLabel={hasValidTerms ? 'Search results' : 'Recent searches'}
      autoFocus
      // @todo: understand why setting `fixedHeight=true` on search results incorrectly renders the height of the first item
      // fixedHeight={hasValidTerms}
      initialIndex={hasValidTerms ? initialIndex : 0}
      itemComponent={hasValidTerms ? SearchResultVirtualItem : RecentSearchVirtualItem}
      values={values}
      virtualizerOptions={{
        estimateSize: () =>
          hasValidTerms
            ? VIRTUAL_LIST_SEARCH_RESULT_ITEM_HEIGHT
            : VIRTUAL_LIST_RECENT_SEARCH_ITEM_HEIGHT,
        overscan: VIRTUAL_LIST_OVERSCAN,
      }}
    >
      {children}
    </CommandListProvider>
  )
}
