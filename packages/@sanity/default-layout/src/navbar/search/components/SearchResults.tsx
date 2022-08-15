// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {TextWithTone} from '@sanity/base/components'
import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import React, {Dispatch, SetStateAction, useCallback, useEffect, useRef} from 'react'
import {useVirtual} from 'react-virtual'
import styled from 'styled-components'
import {
  VIRTUAL_LIST_CHILDREN_UI_NAME,
  VIRTUAL_LIST_ITEM_HEIGHT,
  VIRTUAL_LIST_OVERSCAN,
  VIRTUAL_LIST_UI_NAME,
} from '../constants'
import {useCommandList} from '../contexts/commandList'
import {useSearchState} from '../contexts/search'
import {NoResults} from './NoResults'
import {PointerOverlay} from './PointerOverlay'
import {SearchResultItem} from './searchResultItem'

interface SearchResultsProps {
  initialSearchIndex?: number
  onClose: () => void
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement>>
}

export function SearchResults({
  initialSearchIndex,
  onClose,
  setChildContainerRef,
  setPointerOverlayRef,
}: SearchResultsProps) {
  const {
    dispatch,
    state: {terms, result},
  } = useSearchState()

  const childParentRef = useRef()
  const isMounted = useRef(false)

  const {scrollToIndex, totalSize, virtualItems} = useVirtual({
    estimateSize: useCallback(() => VIRTUAL_LIST_ITEM_HEIGHT, []),
    overscan: VIRTUAL_LIST_OVERSCAN,
    parentRef: childParentRef,
    size: result.hits.length,
  })

  const {onChildClick, onChildMouseDown, onChildMouseEnter} = useCommandList()

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

  /**
   * Scroll virtual list to initial index, if specified
   */
  useEffect(() => {
    if (typeof initialSearchIndex === 'number' && result.hits.length) {
      scrollToIndex(initialSearchIndex, {align: 'start'})
    }
  }, [initialSearchIndex, result.hits.length, scrollToIndex])

  /**
   * After initial mount: scroll virtual list to top on search query change (and after results have loaded)
   */
  useEffect(() => {
    if (isMounted.current && result.loaded) {
      scrollToIndex(0)
    }

    isMounted.current = true
  }, [scrollToIndex, result.loaded, terms.query])

  return (
    <SearchResultsWrapper $loading={result.loading}>
      <PointerOverlay ref={setPointerOverlayRef} />

      {result.error ? (
        <Flex align="center" direction="column" gap={3} marginY={2} padding={4}>
          <Box marginBottom={1}>
            <TextWithTone tone="critical">
              <WarningOutlineIcon />
            </TextWithTone>
          </Box>
          <TextWithTone size={2} tone="critical" weight="semibold">
            Something went wrong while searching
          </TextWithTone>
          <TextWithTone size={1} tone="critical">
            Please try again or check your connection
          </TextWithTone>
        </Flex>
      ) : (
        <>
          {!!result.hits.length && (
            // (Has search results)
            <VirtualList data-ui={VIRTUAL_LIST_UI_NAME} ref={childParentRef}>
              <VirtualListChildren
                $height={totalSize}
                data-ui={VIRTUAL_LIST_CHILDREN_UI_NAME}
                paddingBottom={1}
                ref={setChildContainerRef}
              >
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
