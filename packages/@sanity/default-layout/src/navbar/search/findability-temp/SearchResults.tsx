import {Card, Flex, MenuItem, Spinner, Stack, Text} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {SearchTerms} from '@sanity/base'
import schema from 'part:@sanity/base/schema'
import {useSearch} from '../useSearch'
import {useSearchDispatch, useSearchState} from './state/SearchContext'
import {addSearchTerm, getRecentSearchTerms} from './local-storage/search-store'
import {RecentSearchItem} from './RecentSearchItem'
import {showNoResults, showRecentSearches, showResults} from './state/search-selectors'
import {SearchResultItem} from './SearchResultItem'

interface SearchResultsProps {
  onResultClick: () => void
  onRecentSearchClick: () => void
}

const SEARCH_LIMIT = 5

export function SearchResults(props: SearchResultsProps) {
  const {onResultClick, onRecentSearchClick} = props

  const {state, dispatch} = useSyncedSearch()
  const {terms, result} = state
  const {hits, loading, error} = result

  const [recentSearches, setResentSearches] = useState(() => getRecentSearchTerms(schema))

  const handleResultClick = useCallback(() => {
    addSearchTerm(terms)
    setResentSearches(getRecentSearchTerms(schema))
    onResultClick()
  }, [onResultClick, terms])

  const handleRecentSearchClick = useCallback(
    (searchTerms: SearchTerms) => {
      // announce states
      // no results
      // maybe not results
      //announce naviagion to recent search

      // LOOK INTO sanity ui hover focus issue
      dispatch({type: 'SET_TERMS', terms: searchTerms})
      addSearchTerm(searchTerms)
      setResentSearches(getRecentSearchTerms(schema))
      onRecentSearchClick()
    },
    [dispatch, onRecentSearchClick]
  )

  return (
    <Stack
      flex={1}
      style={{maxHeight: 'calc(100vh - 100px)'}}
      overflow={!loading && hits.length ? 'auto' : undefined}
    >
      {showNoResults(state) && (
        <Flex justify="center" padding={3}>
          <Text>
            No results for <strong>"{terms.query}"</strong> in{' '}
            {terms.types.length > 0
              ? terms.types.map((i) => i.title ?? i.name).join(', ')
              : 'all document types'}
          </Text>
        </Flex>
      )}

      {loading && (
        <Flex justify="center" padding={3}>
          <Spinner />
        </Flex>
      )}

      {!loading && error && (
        <Flex justify="center" padding={3}>
          <Card padding={2} tone="critical">
            Search failed. An unexpected error occurred.
          </Card>
        </Flex>
      )}

      {showResults(state) &&
        hits.map((hit) => (
          <SearchResultItem key={hit.hit._id} hit={hit} onClick={handleResultClick} />
        ))}

      {showRecentSearches(state) &&
        recentSearches?.map((recentSearch) => (
          <RecentSearchItem
            key={recentSearch.__recentTimestamp}
            value={recentSearch}
            onClick={handleRecentSearchClick}
          />
        ))}
    </Stack>
  )
}

function useSyncedSearch() {
  const state = useSearchState()
  const dispatch = useSearchDispatch()
  const {terms, result} = state

  const {handleSearch, searchState: syncState} = useSearch({
    searchString: terms.query,
    ...result,
    terms,
  })

  useEffect(() => {
    dispatch({
      type: 'UPDATE_SEARCH_STATE',
      state: {
        hits: syncState.hits,
        loading: syncState.loading,
        error: syncState.error,
      },
    })
  }, [syncState, dispatch])

  useEffect(() => {
    if (Object.keys(terms).some((key) => terms[key] !== syncState.terms[key])) {
      handleSearch({
        ...terms,
        limit: SEARCH_LIMIT,
        offset: 0,
      })
    }
  }, [terms, syncState.terms, handleSearch])

  return {state, dispatch}
}
