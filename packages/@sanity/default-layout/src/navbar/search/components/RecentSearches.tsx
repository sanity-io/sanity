import type {SearchTerms} from '@sanity/base'
import {useRovingFocus} from '@sanity/base/components'
import {Box, Label, Stack} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {useCallback, useState} from 'react'
import {addSearchTerm, getRecentSearchTerms} from '../datastores/recentSearches'
import {useSearchState} from '../contexts/search'
import {Instructions} from './Instructions'
import {RecentSearchItem} from './RecentSearchItem'

interface RecentSearchesProps {
  showFiltersOnClick?: boolean
}

export function RecentSearches({showFiltersOnClick}: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState(() => getRecentSearchTerms(schema))
  const [focusRootElement, setFocusRootElement] = useState<HTMLDivElement | null>(null)
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

  // Enable keyboard arrow navigation
  useRovingFocus({
    direction: 'vertical',
    initialFocus: 'first',
    loop: true,
    rootElement: focusRootElement,
  })

  return (
    <Box flex={1}>
      {recentSearches.length ? (
        <>
          <Box paddingBottom={2} paddingTop={3} paddingX={3}>
            <Label muted size={1}>
              Recent searches
            </Label>
          </Box>
          <Stack padding={1} ref={setFocusRootElement} space={1}>
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
