import {Card, Flex} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {CommandListItems} from '../../../../../../components'
import {useSearchState} from '../../contexts/search/useSearchState'
import {NoResults} from '../NoResults'
import {SearchError} from '../SearchError'
import {SortMenu} from '../SortMenu'

const SearchResultsCard = styled(Card)`
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
`

const SearchResultsFlex = styled(Flex)`
  height: 100%;
`

const SearchResultsInnerFlex = styled(Flex)<{$loading: boolean}>`
  opacity: ${({$loading}) => ($loading ? 0.5 : 1)};
  overflow: hidden;
  position: relative;
  transition: 300ms opacity;
  width: 100%;
`

export function SearchResults() {
  const {
    state: {fullscreen, result},
  } = useSearchState()

  const hasSearchResults = !!result.hits.length
  const hasNoSearchResults = !result.hits.length && result.loaded
  const hasError = result.error

  return (
    <SearchResultsCard
      borderTop={fullscreen || !!(hasError || hasSearchResults || hasNoSearchResults)}
      flex={1}
    >
      <SearchResultsFlex direction="column">
        {/* Sort menu */}
        {hasSearchResults && <SortMenu />}

        {/* Results */}
        <SearchResultsInnerFlex $loading={result.loading} aria-busy={result.loading} flex={1}>
          {hasError ? (
            <SearchError />
          ) : (
            <>
              {hasSearchResults && <CommandListItems paddingBottom={2} />}
              {hasNoSearchResults && <NoResults />}
            </>
          )}
        </SearchResultsInnerFlex>
      </SearchResultsFlex>
    </SearchResultsCard>
  )
}
