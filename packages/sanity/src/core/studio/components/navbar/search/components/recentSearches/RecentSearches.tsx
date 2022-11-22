import {Box, Card, Button, Label, Stack, Text, useMediaIndex} from '@sanity/ui'
import React, {Dispatch, MouseEvent, SetStateAction, useCallback, useMemo} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../../contexts/search/useSearchState'
import {RecentSearch} from '../../datastores/recentSearches'
import {PointerOverlay} from '../filters/common/PointerOverlay'
import {Instructions} from '../Instructions'
import {RecentSearchItem} from './RecentSearchItem'

interface RecentSearchesProps {
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  showFiltersOnClick?: boolean
  onClear?: () => void
}

// Max character count of selected document types (combined) by breakpoint
const MAX_COMBINED_TYPE_COUNT_SMALL = 20
const MAX_COMBINED_TYPE_COUNT_LARGE = 40

const RecentSearchesBox = styled(Card)`
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
    if (recentSearchesStore) {
      const updatedRecentSearches = recentSearchesStore.removeSearch()
      dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
    }
    onClear?.()
  }, [dispatch, recentSearchesStore, onClear])

  const handleRecentSearchClick = useCallback(
    (searchTerms: RecentSearch) => {
      const hasFilters = searchTerms.filters && searchTerms.filters.length
      const hasTypes = searchTerms.types.length

      // Optionally show filters panel if search terms or filters are present
      if (showFiltersOnClick && (hasFilters || hasTypes)) {
        dispatch({type: 'FILTERS_VISIBLE_SET', visible: true})
      }
      dispatch({type: 'TERMS_SET', filters: searchTerms?.filters, terms: searchTerms})

      // Add to Local Storage
      if (recentSearchesStore) {
        const updatedRecentSearches = recentSearchesStore?.addSearch(
          searchTerms,
          searchTerms?.filters
        )
        dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
      }
    },
    [dispatch, recentSearchesStore, showFiltersOnClick]
  )

  const handleRecentSearchDelete = useCallback(
    (index: number) => (event: MouseEvent) => {
      event.stopPropagation()
      // Remove from Local Storage
      if (recentSearchesStore) {
        const updatedRecentSearches = recentSearchesStore?.removeSearchAtIndex(index)
        dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
      }
    },
    [dispatch, recentSearchesStore]
  )

  return (
    <RecentSearchesBox borderTop flex={1}>
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
                <div data-index={index} key={recentSearch.__recent.timestamp}>
                  <RecentSearchItem
                    index={index}
                    maxVisibleTypePillChars={maxVisibleTypePillChars}
                    onClick={handleRecentSearchClick}
                    onDelete={handleRecentSearchDelete(index)}
                    value={recentSearch}
                  />
                </div>
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
