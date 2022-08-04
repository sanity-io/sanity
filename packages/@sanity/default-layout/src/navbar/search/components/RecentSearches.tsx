import type {SearchTerms} from '@sanity/base'
import {TextWithTone} from '@sanity/base/components'
import {hues} from '@sanity/color'
import {Box, Button, Card, Inline, Label, Stack, Text} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {MouseEvent, RefObject, useCallback, useState} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../contexts/search'
import {
  addSearchTerm,
  getRecentSearchTerms,
  removeSearchTermAtIndex,
  removeSearchTerms,
} from '../datastores/recentSearches'
import {withCommandPaletteItemStyles} from '../utils/applyCommandPaletteItemStyles'
import {Instructions} from './Instructions'
import {RecentSearchItem} from './RecentSearchItem'

const CommandPaletteButton = withCommandPaletteItemStyles(Button)
interface RecentSearchesProps {
  childContainerRef: RefObject<HTMLDivElement>
  showFiltersOnClick?: boolean
}

export function RecentSearches({childContainerRef, showFiltersOnClick}: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState(() => getRecentSearchTerms(schema))
  const {dispatch} = useSearchState()

  const handleClearRecentSearchesClick = useCallback(() => {
    removeSearchTerms()
    setRecentSearches(getRecentSearchTerms(schema))
  }, [])

  const handleRecentSearchClick = useCallback(
    (searchTerms: SearchTerms) => {
      // Optionally show filters panel if search terms are present
      if (showFiltersOnClick && searchTerms.types.length) {
        dispatch({type: 'FILTERS_SHOW'})
      }
      dispatch({type: 'TERMS_SET', terms: searchTerms})
      addSearchTerm(searchTerms)
      setRecentSearches(getRecentSearchTerms(schema))
    },
    [dispatch, showFiltersOnClick]
  )

  const handleRecentSearchDelete = useCallback(
    (index: number) => (event: MouseEvent) => {
      event.stopPropagation()
      removeSearchTermAtIndex(index)
      setRecentSearches(getRecentSearchTerms(schema))
    },
    []
  )

  return (
    <Box flex={1}>
      {recentSearches.length ? (
        <>
          <Box paddingBottom={2} paddingTop={4} paddingX={3}>
            <Label muted size={1}>
              Recent searches
            </Label>
          </Box>
          <Stack paddingX={1} paddingTop={1} ref={childContainerRef} space={1}>
            {recentSearches?.map((recentSearch, index) => (
              <RecentSearchItem
                key={recentSearch.__recentTimestamp}
                onClick={handleRecentSearchClick}
                onDelete={handleRecentSearchDelete(index)}
                value={recentSearch}
              />
            ))}
          </Stack>
          <Box paddingBottom={1} paddingTop={2} paddingX={1}>
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
    </Box>
  )
}
