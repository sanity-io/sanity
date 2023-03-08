import {useMediaIndex} from '@sanity/ui'
import React, {ReactNode, useCallback, useMemo} from 'react'
import {
  CommandListProvider,
  CommandListVirtualItemProps,
  CommandListVirtualItemValue,
} from '../../../../../../components'
import {WeightedHit} from '../../../../../../search'
import {getPublishedId} from '../../../../../../util/draftUtils'
import {useSearchState} from '../../contexts/search/useSearchState'
import {RecentSearch} from '../../datastores/recentSearches'
import {RecentSearchItem} from '../recentSearches/item/RecentSearchItem'
import {DebugOverlay} from '../searchResults/item/DebugOverlay'
import {SearchResultItem} from '../searchResults/item/SearchResultItem'

export const VIRTUAL_LIST_SEARCH_RESULT_ITEM_HEIGHT = 59 // px
export const VIRTUAL_LIST_RECENT_SEARCH_ITEM_HEIGHT = 36 // px
export const VIRTUAL_LIST_OVERSCAN = 4

interface CommonSearchProps {
  children?: ReactNode
  hasValidTerms: boolean
  initialIndex: number
  onClose: (topIndex?: number) => void
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
export function SharedCommandList({
  children,
  hasValidTerms,
  initialIndex,
  onClose,
}: CommonSearchProps) {
  const {
    dispatch,
    recentSearchesStore,
    state: {filters, recentSearches, result, terms},
  } = useSearchState()

  /**
   * Add current search to recent searches, trigger child item click and close search
   */
  const handleSearchResultClick = useCallback(() => {
    if (recentSearchesStore) {
      const updatedRecentSearches = recentSearchesStore.addSearch(terms, filters)
      dispatch({
        recentSearches: updatedRecentSearches,
        type: 'RECENT_SEARCHES_SET',
      })
    }
    onClose()
  }, [dispatch, filters, onClose, recentSearchesStore, terms])

  const RecentSearchVirtualItem = useMemo(() => {
    // Max character count of selected document types (combined) by breakpoint
    const MAX_COMBINED_TYPE_COUNT_SMALL = 20
    const MAX_COMBINED_TYPE_COUNT_LARGE = 40

    return function RecentSearchVirtualItemComponent({
      value,
      virtualIndex,
    }: CommandListVirtualItemProps<RecentSearch>) {
      const mediaIndex = useMediaIndex()

      const maxVisibleTypePillChars = useMemo(() => {
        return mediaIndex < 2 ? MAX_COMBINED_TYPE_COUNT_SMALL : MAX_COMBINED_TYPE_COUNT_LARGE
      }, [mediaIndex])

      return (
        <RecentSearchItem
          index={virtualIndex}
          maxVisibleTypePillChars={maxVisibleTypePillChars}
          paddingTop={1}
          paddingX={2}
          value={value}
        />
      )
    }
  }, [])

  const SearchResultVirtualItem = useMemo(() => {
    return function SearchResultVirtualItemComponent({
      value,
    }: CommandListVirtualItemProps<WeightedHit>) {
      const {
        state: {debug},
      } = useSearchState()

      return (
        <>
          <SearchResultItem
            documentId={getPublishedId(value.hit._id) || ''}
            documentType={value.hit._type}
            onClick={handleSearchResultClick}
            paddingTop={2}
            paddingX={2}
          />
          {debug && <DebugOverlay data={value} />}
        </>
      )
    }
  }, [handleSearchResultClick])

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
      fixedHeight={hasValidTerms}
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
