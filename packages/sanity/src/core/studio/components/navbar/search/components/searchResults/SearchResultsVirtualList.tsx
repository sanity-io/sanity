import {useVirtualizer} from '@tanstack/react-virtual'
import React, {useCallback, useEffect, useState} from 'react'
import {getPublishedId} from '../../../../../../util/draftUtils'
import {VIRTUAL_LIST_SEARCH_ITEM_HEIGHT, VIRTUAL_LIST_SEARCH_OVERSCAN} from '../../constants'
import {useSearchState} from '../../contexts/search/useSearchState'
import {CommandListItem} from '../commandList/CommandListItem'
import {CommandListItems} from '../commandList/CommandListItems'
import {useCommandList} from '../commandList/useCommandList'
import {DebugOverlay} from './item/DebugOverlay'
import {SearchResultItem} from './item/SearchResultItem'

interface SearchResultsVirtualListProps {
  onClose: () => void
}

export function SearchResultsVirtualList({onClose}: SearchResultsVirtualListProps) {
  const [virtualList, setVirtualListRef] = useState<HTMLDivElement | null>(null)

  const {
    dispatch,
    recentSearchesStore,
    state: {debug, filters, terms, result},
  } = useSearchState()

  const {setVirtualListScrollToIndex} = useCommandList()

  const {getTotalSize, getVirtualItems, scrollToIndex} = useVirtualizer({
    count: result.hits.length,
    getScrollElement: () => virtualList,
    estimateSize: () => VIRTUAL_LIST_SEARCH_ITEM_HEIGHT,
    overscan: VIRTUAL_LIST_SEARCH_OVERSCAN,
  })

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

  /**
   * Send react-virtual's `scrollToIndex` function to shared CommandList context
   */
  useEffect(() => {
    setVirtualListScrollToIndex(scrollToIndex)
  }, [setVirtualListScrollToIndex, scrollToIndex])

  return (
    <CommandListItems
      paddingBottom={2}
      setVirtualListRef={setVirtualListRef}
      totalHeight={getTotalSize()}
    >
      {getVirtualItems().map((virtualRow) => {
        const hit = result.hits[virtualRow.index]
        return (
          <CommandListItem
            activeIndex={virtualRow.index}
            data-index={virtualRow.index}
            fixedHeight
            key={virtualRow.key}
            virtualRow={virtualRow}
          >
            <SearchResultItem
              documentId={getPublishedId(hit.hit._id) || ''}
              documentType={hit.hit._type}
              key={virtualRow.key}
              onClick={handleResultClick}
              paddingTop={2}
              paddingX={2}
            />
            {debug && <DebugOverlay data={hit} />}
          </CommandListItem>
        )
      })}
    </CommandListItems>
  )
}
