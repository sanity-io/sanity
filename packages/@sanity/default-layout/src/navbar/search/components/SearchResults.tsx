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

export function SearchResults({
  onClose,
  setChildContainerRef,
  setPointerOverlayRef,
}: SearchResultsProps) {
  const {
    dispatch,
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

  /*
  // Load next page and focus previous sibling
  const handleLoadMore = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      dispatch({type: 'PAGE_INCREMENT'})

      const previousSibling = event?.currentTarget?.previousElementSibling as HTMLElement
      if (previousSibling) {
        previousSibling.focus()
        previousSibling.setAttribute('aria-selected', 'true')
        previousSibling.setAttribute('tabIndex', '0')
      }
    },
    [dispatch]
  )
  */

  /**
   * Add current search terms to recent searches, trigger child item click and close search
   */
  const handleResultClick = useCallback(() => {
    dispatch({
      terms,
      type: 'RECENT_SEARCHES_ADD',
    })
    onChildClick?.()
    onClose()
  }, [dispatch, onChildClick, onClose, terms])

  return (
    <SearchResultsWrapper aria-busy={result.loading} $loading={result.loading}>
      <PointerOverlay ref={setPointerOverlayRef} />

      {result.error ? (
        <SearchError />
      ) : (
        <>
          {!!result.hits.length && (
            // (Has search results)
            <VirtualList ref={childParentRef}>
              <VirtualListChildren $height={totalSize} paddingBottom={1} ref={setChildContainerRef}>
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

                {/*result.hasMore && (
                <Button
                  disabled={result.loading}
                  mode="bleed"
                  onClick={handleLoadMore}
                  text="More"
                  title="Load more search results"
                />
              )*/}
              </VirtualListChildren>
            </VirtualList>
          )}

          {!result.hits.length && result.loaded && (
            // (No results)
            <NoResults />
          )}
        </>
      )}
    </SearchResultsWrapper>
  )
}

const SearchResultsWrapper = styled.div<{$loading: boolean}>`
  height: 100%;
  opacity: ${({$loading}) => ($loading ? 0.5 : 1)};
  overflow: hidden;
  position: relative;
  transition: 300ms opacity;
  width: 100%;
`

const VirtualList = styled(Box)`
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
`

const VirtualListChildren = styled(Box)<{$height: number}>`
  height: ${({$height}) => `${$height}px`};
  position: relative;
  width: 100%;
`
