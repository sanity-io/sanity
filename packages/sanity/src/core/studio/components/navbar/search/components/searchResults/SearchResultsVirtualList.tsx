import React, {useCallback, useMemo} from 'react'
import {CommandListItems} from '../../../../../../components'
import {getPublishedId} from '../../../../../../util/draftUtils'
import {VIRTUAL_LIST_SEARCH_ITEM_HEIGHT, VIRTUAL_LIST_SEARCH_OVERSCAN} from '../../constants'
import {useSearchState} from '../../contexts/search/useSearchState'
import {DebugOverlay} from './item/DebugOverlay'
import {SearchResultItem} from './item/SearchResultItem'

interface SearchResultsVirtualListProps {
  onClose: () => void
}

export function SearchResultsVirtualList({onClose}: SearchResultsVirtualListProps) {
  const {
    dispatch,
    recentSearchesStore,
    state: {debug, filters, terms, result},
  } = useSearchState()

  /**
   * Add current search to recent searches, trigger child item click and close search
   */
  const handleResultClick = useCallback(() => {
    if (recentSearchesStore) {
      const updatedRecentSearches = recentSearchesStore.addSearch(terms, filters)
      dispatch({
        recentSearches: updatedRecentSearches,
        type: 'RECENT_SEARCHES_SET',
      })
    }
    onClose()
  }, [dispatch, filters, onClose, recentSearchesStore, terms])

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({index}: {index: number}) {
      const hit = result.hits[index]
      return (
        <>
          <SearchResultItem
            documentId={getPublishedId(hit.hit._id) || ''}
            documentType={hit.hit._type}
            onClick={handleResultClick}
            paddingTop={2}
            paddingX={2}
          />
          {debug && <DebugOverlay data={hit} />}
        </>
      )
    }
  }, [debug, handleResultClick, result.hits])

  return (
    <CommandListItems
      fixedHeight
      item={VirtualListItem}
      paddingBottom={2}
      virtualizerOptions={{
        estimateSize: () => VIRTUAL_LIST_SEARCH_ITEM_HEIGHT,
        overscan: VIRTUAL_LIST_SEARCH_OVERSCAN,
      }}
    />
  )
}
