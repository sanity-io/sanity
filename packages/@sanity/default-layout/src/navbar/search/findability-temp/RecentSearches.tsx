import type {SearchTerms} from '@sanity/base'
import {Box, Flex, Label, Stack, Text} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {useCallback, useState} from 'react'
import {addSearchTerm, getRecentSearchTerms} from './local-storage/search-store'
import {RecentSearchItem} from './RecentSearchItem'
import {useOmnisearch} from './state/OmnisearchContext'

export function RecentSearches() {
  const [recentSearches, setRecentSearches] = useState(() => getRecentSearchTerms(schema))
  const {dispatch} = useOmnisearch()

  const handleRecentSearchClick = useCallback(
    (searchTerms: SearchTerms) => {
      // announce states
      // no results
      // maybe not results
      //announce naviagion to recent search

      // LOOK INTO sanity ui hover focus issue
      dispatch({type: 'TERMS_SET', terms: searchTerms})
      addSearchTerm(searchTerms)
      setRecentSearches(getRecentSearchTerms(schema))
      // onRecentSearchClick()
    },
    [dispatch]
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
          <Stack space={1}>
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
        <Flex align="center" direction="column" gap={2} paddingX={4} paddingY={5}>
          <Text align="center" muted size={2}>
            Your recent searches will appear here
          </Text>
        </Flex>
      )}
    </Box>
  )
}
