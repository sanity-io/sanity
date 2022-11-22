import {Box} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import React, {Dispatch, SetStateAction, useCallback, useEffect, useRef} from 'react'
import styled from 'styled-components'
import {getPublishedId} from '../../../../../../util/draftUtils'
import {VIRTUAL_LIST_ITEM_HEIGHT, VIRTUAL_LIST_OVERSCAN} from '../../constants'
import {useCommandList} from '../../contexts/commandList'
import {useSearchState} from '../../contexts/search/useSearchState'
import {PointerOverlay} from '../filters/common/PointerOverlay'
import {SearchResultItem} from './items/SearchResultItem'

interface SearchResultsVirtualListProps {
  onClose: () => void
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement | null>>
}

const VirtualListBox = styled(Box)`
  height: 100%;
  outline: none;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
`

const VirtualListChildBox = styled(Box)<{$height: number}>`
  height: ${({$height}) => `${$height}px`};
  position: relative;
  width: 100%;
`

export function SearchResultsVirtualList({
  onClose,
  setChildContainerRef,
  setPointerOverlayRef,
}: SearchResultsVirtualListProps) {
  const childParentRef = useRef<HTMLDivElement | null>(null)

  const {
    dispatch,
    recentSearchesStore,
    state: {debug, filters, terms, result},
  } = useSearchState()

  const {onChildClick, onChildMouseDown, onChildMouseEnter, setVirtualListScrollToIndex} =
    useCommandList()

  const {getTotalSize, getVirtualItems, scrollToIndex} = useVirtualizer({
    count: result.hits.length,
    enableSmoothScroll: false,
    getScrollElement: () => childParentRef.current,
    estimateSize: () => VIRTUAL_LIST_ITEM_HEIGHT,
    overscan: VIRTUAL_LIST_OVERSCAN,
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
    onChildClick?.()
    onClose()
  }, [dispatch, filters, onChildClick, onClose, recentSearchesStore, terms])

  /**
   * Send react-virtual's `scrollToIndex` function to shared CommandList context
   */
  useEffect(() => {
    setVirtualListScrollToIndex(scrollToIndex)
  }, [setVirtualListScrollToIndex, scrollToIndex])

  return (
    <VirtualListBox data-overflow ref={childParentRef} tabIndex={-1}>
      <PointerOverlay ref={setPointerOverlayRef} />
      <VirtualListChildBox $height={getTotalSize()} paddingBottom={1} ref={setChildContainerRef}>
        {getVirtualItems().map((virtualRow) => {
          const hit = result.hits[virtualRow.index]
          return (
            <div
              data-index={virtualRow.index}
              key={virtualRow.key}
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
                data={hit}
                debug={debug}
                documentId={getPublishedId(hit.hit._id) || ''}
                key={virtualRow.key}
                onClick={handleResultClick}
                onMouseDown={onChildMouseDown}
                onMouseEnter={onChildMouseEnter(virtualRow.index)}
              />
            </div>
          )
        })}
      </VirtualListChildBox>
    </VirtualListBox>
  )
}
