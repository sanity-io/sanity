// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {Box} from '@sanity/ui'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import React, {Dispatch, SetStateAction, useCallback, useEffect, useRef} from 'react'
import {useVirtual} from 'react-virtual'
import styled from 'styled-components'
import {VIRTUAL_LIST_ITEM_HEIGHT, VIRTUAL_LIST_OVERSCAN} from '../constants'
import {useCommandList} from '../contexts/commandList'
import {useSearchState} from '../contexts/search'
import {NoResults} from './NoResults'
import {PointerOverlay} from './PointerOverlay'
import {SearchError} from './SearchError'
import {SearchResultItem} from './searchResultItem'

interface SearchResultsProps {
  onClose: () => void
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement>>
}

const SearchResultsDiv = styled.div<{$loading: boolean}>`
  height: 100%;
  opacity: ${({$loading}) => ($loading ? 0.5 : 1)};
  overflow: hidden;
  position: relative;
  transition: 300ms opacity;
  width: 100%;
`

const VirtualListBox = styled(Box)`
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
`

const VirtualListChildBox = styled(Box)<{$height: number}>`
  height: ${({$height}) => `${$height}px`};
  position: relative;
  width: 100%;
`

export function SearchResults({
  onClose,
  setChildContainerRef,
  setPointerOverlayRef,
}: SearchResultsProps) {
  const {
    dispatch,
    recentSearchesStore,
    state: {terms, result},
  } = useSearchState()

  const childParentRef = useRef()

  const {scrollToIndex, totalSize, virtualItems} = useVirtual({
    estimateSize: useCallback(() => VIRTUAL_LIST_ITEM_HEIGHT, []),
    overscan: VIRTUAL_LIST_OVERSCAN,
    parentRef: childParentRef,
    size: result.hits.length,
  })

  const {
    onChildClick,
    onChildMouseDown,
    onChildMouseEnter,
    setVirtualListScrollToIndex,
  } = useCommandList()

  /**
   * Send react-virtual's `scrollToIndex` function to shared CommandList context
   */
  useEffect(() => {
    setVirtualListScrollToIndex(scrollToIndex)
    return () => setVirtualListScrollToIndex(null)
  }, [setVirtualListScrollToIndex, scrollToIndex])

  /**
   * Add current search terms to recent searches, trigger child item click and close search
   */
  const handleResultClick = useCallback(() => {
    // Add terms to Local Storage
    const updatedRecentSearches = recentSearchesStore?.addSearchTerm(terms)
    dispatch({
      recentSearches: updatedRecentSearches,
      type: 'RECENT_SEARCHES_SET',
    })
    onChildClick?.()
    onClose()
  }, [dispatch, onChildClick, onClose, recentSearchesStore, terms])

  return (
    <SearchResultsDiv aria-busy={result.loading} $loading={result.loading}>
      <PointerOverlay ref={setPointerOverlayRef} />

      {result.error ? (
        <SearchError />
      ) : (
        <>
          {!!result.hits.length && (
            // (Has search results)
            <VirtualListBox ref={childParentRef} tabIndex={-1}>
              <VirtualListChildBox $height={totalSize} paddingBottom={1} ref={setChildContainerRef}>
                {virtualItems.map((virtualRow) => {
                  const hit = result.hits[virtualRow.index]
                  return (
                    <SearchResultItem
                      data={hit}
                      documentId={getPublishedId(hit.hit._id) || ''}
                      index={virtualRow.index}
                      onClick={handleResultClick}
                      onMouseDown={onChildMouseDown}
                      onMouseEnter={onChildMouseEnter(virtualRow.index)}
                      key={hit.hit._id}
                      virtualRow={virtualRow}
                    />
                  )
                })}
              </VirtualListChildBox>
            </VirtualListBox>
          )}

          {!result.hits.length && result.loaded && <NoResults />}
        </>
      )}
    </SearchResultsDiv>
  )
}
