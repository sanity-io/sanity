import {Box, Button, Card, Label, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../../contexts/search/useSearchState'
import {useCommandList} from '../commandList/useCommandList'
import {Instructions} from '../Instructions'
import {RecentSearchesVirtualList} from './RecentSearchesVirtualList'

interface RecentSearchesProps {
  showFiltersOnClick?: boolean
}

const RecentSearchesBox = styled(Card)`
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
`

export function RecentSearches({showFiltersOnClick}: RecentSearchesProps) {
  const {
    dispatch,
    recentSearchesStore,
    state: {filtersVisible, fullscreen, recentSearches},
  } = useSearchState()

  const {focusHeaderInputElement} = useCommandList()

  /**
   * Remove terms from local storage.
   * Also re-focus header input (on non-touch devices)
   */
  const handleClearRecentSearchesClick = useCallback(() => {
    if (recentSearchesStore) {
      const updatedRecentSearches = recentSearchesStore.removeSearch()
      dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
    }
    focusHeaderInputElement()
  }, [dispatch, focusHeaderInputElement, recentSearchesStore])

  const hasRecentSearches = !!recentSearches.length

  return (
    <RecentSearchesBox
      borderTop={hasRecentSearches || (!hasRecentSearches && !filtersVisible && fullscreen)}
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
            <RecentSearchesVirtualList showFiltersOnClick={showFiltersOnClick} />
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
        !filtersVisible && fullscreen && <Instructions />
      )}
    </RecentSearchesBox>
  )
}
