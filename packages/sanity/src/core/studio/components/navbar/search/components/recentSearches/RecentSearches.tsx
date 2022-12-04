import {Box, Button, Card, Label, Text} from '@sanity/ui'
import React, {Dispatch, SetStateAction, useCallback} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../../contexts/search/useSearchState'
import {Instructions} from '../Instructions'
import {RecentSearchesVirtualList} from './RecentSearchesVirtualList'

interface RecentSearchesProps {
  onClear?: () => void
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  showFiltersOnClick?: boolean
}

const RecentSearchesBox = styled(Card)`
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
`

export function RecentSearches({
  onClear,
  setChildContainerRef,
  setPointerOverlayRef,
  showFiltersOnClick,
}: RecentSearchesProps) {
  const {
    dispatch,
    recentSearchesStore,
    state: {filtersVisible, recentSearches},
  } = useSearchState()

  const handleClearRecentSearchesClick = useCallback(() => {
    // Remove terms from Local Storage
    if (recentSearchesStore) {
      const updatedRecentSearches = recentSearchesStore.removeSearch()
      dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
    }
    onClear?.()
  }, [dispatch, recentSearchesStore, onClear])

  const hasRecentSearches = !!recentSearches.length

  return (
    <RecentSearchesBox
      borderTop={hasRecentSearches || (!hasRecentSearches && !filtersVisible)}
      flex={1}
    >
      {recentSearches.length ? (
        <>
          <Box paddingBottom={2} paddingTop={4} paddingX={3}>
            <Label muted size={1}>
              Recent searches
            </Label>
          </Box>
          <Box>
            <RecentSearchesVirtualList
              setChildContainerRef={setChildContainerRef}
              setPointerOverlayRef={setPointerOverlayRef}
              showFiltersOnClick={showFiltersOnClick}
            />
          </Box>
          <Box paddingBottom={2} paddingTop={1} paddingX={2}>
            <Button
              justify="flex-start"
              fontSize={1}
              mode="bleed"
              onClick={handleClearRecentSearchesClick}
              padding={2}
              tone="default"
            >
              <Text muted size={1}>
                Clear recent searches
              </Text>
            </Button>
          </Box>
        </>
      ) : (
        !filtersVisible && <Instructions />
      )}
    </RecentSearchesBox>
  )
}
