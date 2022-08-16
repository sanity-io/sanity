import type {SearchTerms} from '@sanity/base'
import {Box, Button, Label, Stack, Text, useMediaIndex} from '@sanity/ui'
import React, {Dispatch, MouseEvent, SetStateAction, useCallback, useMemo} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../contexts/search'
import {Instructions} from './Instructions'
import {PointerOverlay} from './PointerOverlay'
import {RecentSearchItem} from './RecentSearchItem'

interface RecentSearchesProps {
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement>>
  showFiltersOnClick?: boolean
}

export function RecentSearches({
  setChildContainerRef,
  setPointerOverlayRef,
  showFiltersOnClick,
}: RecentSearchesProps) {
  const {
    dispatch,
    state: {recentSearches},
  } = useSearchState()

  const mediaIndex = useMediaIndex()

  const maxVisibleQueryChars = useMemo(() => {
    return mediaIndex < 2 ? 20 : 40
  }, [mediaIndex])

  const maxVisibleTypePillChars = useMemo(() => {
    return mediaIndex < 2 ? 20 : 40
  }, [mediaIndex])

  const handleClearRecentSearchesClick = useCallback(() => {
    dispatch({type: 'RECENT_SEARCHES_REMOVE_ALL'})
  }, [dispatch])

  const handleRecentSearchClick = useCallback(
    (searchTerms: SearchTerms) => {
      // Optionally show filters panel if search terms are present
      if (showFiltersOnClick && searchTerms.types.length) {
        dispatch({type: 'FILTERS_SHOW'})
      }
      dispatch({type: 'TERMS_SET', terms: searchTerms})
      dispatch({type: 'RECENT_SEARCHES_ADD', terms: searchTerms})
    },
    [dispatch, showFiltersOnClick]
  )

  const handleRecentSearchDelete = useCallback(
    (index: number) => (event: MouseEvent) => {
      event.stopPropagation()
      dispatch({type: 'RECENT_SEARCHES_REMOVE_INDEX', index})
    },
    [dispatch]
  )

  return (
    <RecentSearchesWrapper flex={1}>
      {recentSearches.length ? (
        <>
          <Box paddingBottom={2} paddingTop={4} paddingX={3}>
            <Label muted size={1}>
              Recent searches
            </Label>
          </Box>
          <RecentSearchesInner>
            <PointerOverlay ref={setPointerOverlayRef} />
            <Stack paddingX={1} paddingTop={1} ref={setChildContainerRef} space={1}>
              {recentSearches?.map((recentSearch, index) => (
                <RecentSearchItem
                  data-index={index}
                  index={index}
                  key={recentSearch.__recentTimestamp}
                  maxVisibleQueryChars={maxVisibleQueryChars}
                  maxVisibleTypePillChars={maxVisibleTypePillChars}
                  onClick={handleRecentSearchClick}
                  onDelete={handleRecentSearchDelete(index)}
                  value={recentSearch}
                />
              ))}
            </Stack>
          </RecentSearchesInner>
          <Box padding={1}>
            <Button
              justify="flex-start"
              fontSize={1}
              mode="bleed"
              onClick={handleClearRecentSearchesClick}
              paddingX={2}
              paddingY={3}
              tone="default"
            >
              <Text muted size={1}>
                Clear recent searches
              </Text>
            </Button>
          </Box>
        </>
      ) : (
        <Instructions />
      )}
    </RecentSearchesWrapper>
  )
}

const RecentSearchesWrapper = styled(Box)`
  position: relative;
`

const RecentSearchesInner = styled(Box)`
  position: relative;
`
