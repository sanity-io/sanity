import {Box} from '@sanity/ui'
import React from 'react'
import {RecentSearches} from './RecentSearches'
import {SearchResults} from './SearchResults'
import {useOmnisearch} from './state/OmnisearchContext'

export function DialogContent() {
  const {
    state: {terms},
  } = useOmnisearch()

  // TODO: focus search results when a recent search has been selected
  // const handleRecentSearchClick = useCallback(() => openedInput.current?.focus(), [])
  const hasQueryOrTypes = terms.query !== '' || terms.types.length

  return (
    <Box flex={1} style={{overflowX: 'hidden', overflowY: 'auto'}}>
      {hasQueryOrTypes ? (
        <SearchResults
        // onRecentSearchClick={handleRecentSearchClick}
        />
      ) : (
        <RecentSearches />
      )}
    </Box>
  )
}
