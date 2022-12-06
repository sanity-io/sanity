import {useVirtualizer} from '@tanstack/react-virtual'
import React, {useCallback, useEffect, useState} from 'react'
import {getPublishedId} from '../../../../../../util/draftUtils'
import {VIRTUAL_LIST_SEARCH_ITEM_HEIGHT, VIRTUAL_LIST_SEARCH_OVERSCAN} from '../../constants'
import {useSearchState} from '../../contexts/search/useSearchState'
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

  const {onChildMouseDown, onChildMouseEnter, setVirtualListScrollToIndex} = useCommandList()

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
          <div
            data-index={virtualRow.index}
            key={virtualRow.key}
            onMouseDown={onChildMouseDown}
            onMouseEnter={onChildMouseEnter(virtualRow.index)}
            style={{
              // Kept inline to prevent styled-components from generating loads of classes on virtual list scroll
              flex: 1,
              height: `${virtualRow.size}px`,
              left: 0,
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              width: '100%',
            }}
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
          </div>
        )
      })}
    </CommandListItems>
  )
}
