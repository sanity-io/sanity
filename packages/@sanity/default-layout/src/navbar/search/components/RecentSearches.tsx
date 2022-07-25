import type {SearchTerms} from '@sanity/base'
import {Box, Label, Stack} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {RefObject, useCallback, useState} from 'react'
import {addSearchTerm, getRecentSearchTerms} from '../datastores/recentSearches'
import {useSearchState} from '../contexts/search'
import {Instructions} from './Instructions'
import {RecentSearchItem} from './RecentSearchItem'

interface RecentSearchesProps {
  menuContainerRef: RefObject<HTMLDivElement>
  showFiltersOnClick?: boolean
}

export function RecentSearches({menuContainerRef, showFiltersOnClick}: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState(() => getRecentSearchTerms(schema))
  const {dispatch} = useSearchState()

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

  return (
    <Box flex={1}>
      {recentSearches.length ? (
        <>
          <Box paddingBottom={2} paddingTop={3} paddingX={3}>
            <Label muted size={1}>
              Recent searches
            </Label>
          </Box>
          <Stack padding={1} ref={menuContainerRef} space={1}>
            {recentSearches?.map((recentSearch) => (
              <RecentSearchItem
                key={recentSearch.__recentTimestamp}
                onClick={handleRecentSearchClick}
                value={recentSearch}
              />
            ))}
          </Stack>
        </>
      ) : (
        <Instructions />
      )}
    </Box>
  )
}
