// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {TextWithTone} from '@sanity/base/components'
import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Flex, Stack} from '@sanity/ui'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import React, {RefObject, useCallback} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../contexts/search'
import {NoResults} from './NoResults'
import {PointerOverlay} from './PointerOverlay'
import {SearchResultItem} from './searchResultItem'

interface SearchResultsProps {
  childContainerRef: RefObject<HTMLDivElement>
  onClose: () => void
  pointerOverlayRef: RefObject<HTMLDivElement>
}

export function SearchResults({childContainerRef, onClose, pointerOverlayRef}: SearchResultsProps) {
  const {
    dispatch,
    state: {terms, result},
  } = useSearchState()

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

  const handleResultClick = useCallback(() => {
    dispatch({
      terms,
      type: 'RECENT_SEARCHES_ADD',
    })
    onClose()
  }, [dispatch, onClose, terms])

  return (
    <SearchResultsWrapper $loading={result.loading}>
      <PointerOverlay ref={pointerOverlayRef} />

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
            <Stack padding={1} ref={childContainerRef} space={1}>
              {result.hits.map((hit) => (
                <SearchResultItem
                  data={hit}
                  documentId={getPublishedId(hit.hit._id) || ''}
                  key={hit.hit._id}
                  onClick={handleResultClick}
                  padding={2}
                />
              ))}
              {/*result.hasMore && (
                <Button
                  disabled={result.loading}
                  mode="bleed"
                  onClick={handleLoadMore}
                  text="More"
                  title="Load more search results"
                />
              )*/}
            </Stack>
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
  opacity: ${({$loading}) => ($loading ? 0.5 : 1)};
  position: relative;
  transition: 300ms opacity;
`
