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
  onClear?: () => void
}

// Max character count of selected document types (combined) by breakpoint
const MAX_COMBINED_TYPE_COUNT_SMALL = 20
const MAX_COMBINED_TYPE_COUNT_LARGE = 40

const RecentSearchesBox = styled(Box)`
  position: relative;
`

const RecentSearchesInnerBox = styled(Box)`
  position: relative;
`

export function RecentSearches({
  setChildContainerRef,
  setPointerOverlayRef,
  showFiltersOnClick,
  onClear,
}: RecentSearchesProps) {
  const {
    dispatch,
    recentSearchesStore,
    state: {recentSearches},
  } = useSearchState()

  const mediaIndex = useMediaIndex()

  const maxVisibleTypePillChars = useMemo(() => {
    return mediaIndex < 2 ? MAX_COMBINED_TYPE_COUNT_SMALL : MAX_COMBINED_TYPE_COUNT_LARGE
  }, [mediaIndex])

  const handleClearRecentSearchesClick = useCallback(() => {
    // Remove terms from Local Storage
    const updatedRecentSearches = recentSearchesStore?.removeSearchTerms()
    dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
    onClear?.()
  }, [dispatch, recentSearchesStore, onClear])

  const handleRecentSearchClick = useCallback(
    (searchTerms: SearchTerms) => {
      // Optionally show filters panel if search terms are present
      if (showFiltersOnClick && searchTerms.types.length) {
        dispatch({type: 'FILTERS_SHOW'})
      }
      dispatch({type: 'TERMS_SET', terms: searchTerms})
      dispatch({searchableTypes: searchTerms.types, type: 'SEARCHABLE_TYPES_SET'})
      // Add to Local Storage
      const updatedRecentSearches = recentSearchesStore?.addSearchTerm(searchTerms)
      dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
    },
    [dispatch, recentSearchesStore, showFiltersOnClick]
  )

  const handleRecentSearchDelete = useCallback(
    (index: number) => (event: MouseEvent) => {
      event.stopPropagation()
      // Remove from Local Storage
      const updatedRecentSearches = recentSearchesStore?.removeSearchTermAtIndex(index)
      dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
    },
    [dispatch, recentSearchesStore]
  )

  return (
    <RecentSearchesBox flex={1}>
      {recentSearches.length ? (
        <>
          <Box paddingBottom={2} paddingTop={4} paddingX={3}>
            <Label muted size={1}>
              Recent searches
            </Label>
          </Box>
          <RecentSearchesInnerBox>
            <PointerOverlay ref={setPointerOverlayRef} />
            <Stack paddingX={1} paddingTop={1} ref={setChildContainerRef} space={1}>
              {recentSearches?.map((recentSearch, index) => (
                <RecentSearchItem
                  data-index={index}
                  index={index}
                  key={recentSearch.__recentTimestamp}
                  maxVisibleTypePillChars={maxVisibleTypePillChars}
                  onClick={handleRecentSearchClick}
                  onDelete={handleRecentSearchDelete(index)}
                  value={recentSearch}
                />
              ))}
            </Stack>
          </RecentSearchesInnerBox>
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
    </RecentSearchesBox>
  )
}
