// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {Box, Flex} from '@sanity/ui'
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
import {SortMenu} from './SortMenu'

interface SearchResultsProps {
  onClose: () => void
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  small?: boolean
}

const SearchResultsFlex = styled(Flex)`
  height: 100%;
`

const SearchResultsInnerFlex = styled(Flex)<{$loading: boolean}>`
  opacity: ${({$loading}) => ($loading ? 0.5 : 1)};
  overflow: hidden;
  position: relative;
  transition: 300ms opacity;
  width: 100%;
`

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

export function SearchResults({
  onClose,
  setChildContainerRef,
  setPointerOverlayRef,
  small,
}: SearchResultsProps) {
  const {
    dispatch,
    recentSearchesStore,
    state: {debug, terms, result},
  } = useSearchState()

  const childParentRef = useRef<HTMLDivElement | null>(null)

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
  }, [setVirtualListScrollToIndex, scrollToIndex])

  /**
   * Add current search terms to recent searches, trigger child item click and close search
   */
  const handleResultClick = useCallback(() => {
    // Add terms to Local Storage
    if (recentSearchesStore) {
      const updatedRecentSearches = recentSearchesStore.addSearchTerm(terms)
      dispatch({
        recentSearches: updatedRecentSearches,
        type: 'RECENT_SEARCHES_SET',
      })
    }
    onChildClick?.()
    onClose()
  }, [dispatch, onChildClick, onClose, recentSearchesStore, terms])

  return (
    <SearchResultsFlex direction="column">
      {/* Sort menu */}
      {!!result.hits.length && <SortMenu small={small} />}

      {/* Results */}
      <SearchResultsInnerFlex $loading={result.loading} aria-busy={result.loading} flex={1}>
        {result.error ? (
          <SearchError />
        ) : (
          <>
            {!!result.hits.length && (
              // (Has search results)
              <VirtualListBox data-overflow ref={childParentRef} tabIndex={-1}>
                <PointerOverlay ref={setPointerOverlayRef} />
                <VirtualListChildBox
                  $height={totalSize}
                  paddingBottom={1}
                  ref={setChildContainerRef}
                >
                  {virtualItems.map((virtualRow) => {
                    const hit = result.hits[virtualRow.index]
                    return (
                      <SearchResultItem
                        data={hit}
                        debug={debug}
                        documentId={getPublishedId(hit.hit._id) || ''}
                        index={virtualRow.index}
                        key={hit.hit._id}
                        onClick={handleResultClick}
                        onMouseDown={onChildMouseDown}
                        onMouseEnter={onChildMouseEnter(virtualRow.index)}
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
      </SearchResultsInnerFlex>
    </SearchResultsFlex>
  )
}
