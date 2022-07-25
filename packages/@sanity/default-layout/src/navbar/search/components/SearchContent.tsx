import {Box} from '@sanity/ui'
import React, {RefObject} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../contexts/search'
import {RecentSearches} from './RecentSearches'
import {SearchResults} from './SearchResults'

interface SearchContentProps {
  menuContainerRef: RefObject<HTMLDivElement>
  onClose: () => void
  showFiltersOnRecentSearch?: boolean
}

export function SearchContent({
  menuContainerRef,
  onClose,
  showFiltersOnRecentSearch,
}: SearchContentProps) {
  const {
    state: {terms},
  } = useSearchState()

  const hasQueryOrTypes = terms.query !== '' || terms.types.length

  return (
    <SearchContentWrapper flex={1}>
      {hasQueryOrTypes ? (
        <SearchResults onClose={onClose} menuContainerRef={menuContainerRef} />
      ) : (
        <RecentSearches
          menuContainerRef={menuContainerRef}
          showFiltersOnClick={showFiltersOnRecentSearch}
        />
      )}
    </SearchContentWrapper>
  )
}

const SearchContentWrapper = styled(Box)`
  overflow-x: hidden;
  overflow-y: auto;
`
