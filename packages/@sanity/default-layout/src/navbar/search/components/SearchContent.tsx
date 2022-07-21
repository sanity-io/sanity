import {Box} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {useSearchState} from '../contexts/search'
import {RecentSearches} from './RecentSearches'
import {SearchResults} from './SearchResults'

interface SearchContentProps {
  onClose: () => void
  showFiltersOnRecentSearch?: boolean
}

export function SearchContent({onClose, showFiltersOnRecentSearch}: SearchContentProps) {
  const {
    state: {terms},
  } = useSearchState()

  const hasQueryOrTypes = terms.query !== '' || terms.types.length

  return (
    <SearchContentWrapper flex={1}>
      {hasQueryOrTypes ? (
        <SearchResults onClose={onClose} />
      ) : (
        <RecentSearches showFiltersOnClick={showFiltersOnRecentSearch} />
      )}
    </SearchContentWrapper>
  )
}

const SearchContentWrapper = styled(Box)`
  overflow-x: hidden;
  overflow-y: auto;
`
