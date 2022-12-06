import {Card, Flex} from '@sanity/ui'
import React, {Dispatch, SetStateAction} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../../contexts/search/useSearchState'
import {NoResults} from '../NoResults'
import {SearchError} from '../SearchError'
import {SortMenu} from '../SortMenu'
import {SearchResultsVirtualList} from './SearchResultsVirtualList'

interface SearchResultsProps {
  onClose: () => void
}

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

export function SearchResults({onClose}: SearchResultsProps) {
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
              {hasSearchResults && <SearchResultsVirtualList onClose={onClose} />}
              {hasNoSearchResults && <NoResults />}
            </>
          )}
        </SearchResultsInnerFlex>
      </SearchResultsFlex>
    </SearchResultsCard>
  )
}
