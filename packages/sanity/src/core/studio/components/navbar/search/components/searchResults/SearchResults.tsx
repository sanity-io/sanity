import {Flex} from '@sanity/ui'
import React, {Dispatch, SetStateAction} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../../contexts/search/useSearchState'
import {NoResults} from '../NoResults'
import {SearchError} from '../SearchError'
import {SearchResultsVirtualList} from './SearchResultsVirtualList'
import {SortMenu} from '../SortMenu'

interface SearchResultsProps {
  onClose: () => void
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  small?: boolean
}

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

export function SearchResults({
  onClose,
  setChildContainerRef,
  setPointerOverlayRef,
  small,
}: SearchResultsProps) {
  const {
    state: {result},
  } = useSearchState()

  const hasSearchResults = !!result.hits.length

  return (
    <SearchResultsFlex direction="column">
      {/* Sort menu */}
      {hasSearchResults && <SortMenu small={small} />}

      {/* Results */}
      <SearchResultsInnerFlex $loading={result.loading} aria-busy={result.loading} flex={1}>
        {result.error ? (
          <SearchError />
        ) : (
          <>
            {hasSearchResults && (
              <SearchResultsVirtualList
                onClose={onClose}
                setChildContainerRef={setChildContainerRef}
                setPointerOverlayRef={setPointerOverlayRef}
              />
            )}

            {!result.hits.length && result.loaded && <NoResults />}
          </>
        )}
      </SearchResultsInnerFlex>
    </SearchResultsFlex>
  )
}
