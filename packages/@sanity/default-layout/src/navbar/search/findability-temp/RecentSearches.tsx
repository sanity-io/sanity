import type {SearchTerms} from '@sanity/base'
import {useRovingFocus} from '@sanity/base/components'
import {Box, Label, Stack} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {useCallback, useState} from 'react'
import {Instructions} from './Instructions'
import {addSearchTerm, getRecentSearchTerms} from './local-storage/search-store'
import {RecentSearchItem} from './RecentSearchItem'
import {useOmnisearch} from './state/OmnisearchContext'

export function RecentSearches() {
  const [recentSearches, setRecentSearches] = useState(() => getRecentSearchTerms(schema))
  const [focusRootElement, setFocusRootElement] = useState<HTMLDivElement | null>(null)
  const {dispatch} = useOmnisearch()

  const handleRecentSearchClick = useCallback(
    (searchTerms: SearchTerms) => {
      // announce states
      // no results
      // maybe not results
      //announce naviagion to recent search

      // LOOK INTO sanity ui hover focus issue
      dispatch({type: 'TERMS_SET', terms: searchTerms})
      dispatch({type: 'FILTERS_SHOW'})
      addSearchTerm(searchTerms)
      setRecentSearches(getRecentSearchTerms(schema))
      // onRecentSearchClick()
    },
    [dispatch]
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
