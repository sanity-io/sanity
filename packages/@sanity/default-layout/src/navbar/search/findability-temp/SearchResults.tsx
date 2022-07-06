import {Box, Button, Flex, MenuItem, Spinner, Stack, Text} from '@sanity/ui'
import {ClockIcon} from '@sanity/icons'
import React, {useCallback, useEffect, useState} from 'react'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {SearchParams} from '@sanity/base'
import schema from 'part:@sanity/base/schema'
import {SchemaType} from '@sanity/types'
import {useSearch} from '../useSearch'
import {SearchItem} from '../SearchItem'
import {useSearchDispatch, useSearchState} from './state/SearchContext'
import {addSearchTerm, getRecentSearchTerms} from './local-storage/search-store'

interface SearchResultsProps {
  onResultClick: () => void
  onRecentSearchClick: () => void
}

export function SearchResults(props: SearchResultsProps) {
  const {onResultClick, onRecentSearchClick} = props
  const {schemas, searchState, query} = useSearchState()
  const {hits, loading, error} = searchState

  const dispatch = useSearchDispatch()
  const [recentSearches, setResentSearches] = useState(() => getRecentSearchTerms(schema))
  const {handleSearch, searchState: syncState} = useSearch({schemas, query, ...searchState})

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
    if (query !== syncState.query || schemas !== syncState.schemas) {
      handleSearch({query, schemas})
    }
  }, [schemas, query, syncState, handleSearch])

  const handleResultClick = useCallback(() => {
    addSearchTerm({query, schemas})
    setResentSearches(getRecentSearchTerms(schema))
    onResultClick()
  }, [onResultClick, query, schemas])

  const handleRecentSearchClick = useCallback(
    (term: SearchParams) => {
      dispatch({type: 'SET_TERMS', terms: term})
      addSearchTerm(term)
      setResentSearches(getRecentSearchTerms(schema))
      onRecentSearchClick()
    },
    [dispatch, onRecentSearchClick]
  )

  return (
    <Stack
      flex={1}
      style={{maxHeight: 'calc(100vh - 80px)'}}
      overflow={!loading && hits.length ? 'auto' : undefined}
    >
      {hits.length === 0 && query !== '' && !loading && (
        <Flex justify="center" padding={3}>
          <Text>
            No results for <strong>"{query}"</strong> in{' '}
            {schemas.length > 0
              ? schemas.map((i) => i.title ?? i.name).join(', ')
              : 'all document types'}
          </Text>
        </Flex>
      )}
      {loading && (
        <Flex justify="center" padding={3}>
          <Spinner />
        </Flex>
      )}

      {!loading &&
        hits.slice(0, 50).map((hit) => (
          <MenuItem key={hit.hit._id} onClick={handleResultClick} padding={1}>
            <SearchItem
              data={hit}
              key={hit.hit._id}
              padding={2}
              documentId={getPublishedId(hit.hit._id) || ''}
            />
          </MenuItem>
        ))}

      {!loading &&
        query === '' &&
        !schemas.length &&
        recentSearches?.map((term) => (
          <MenuItem
            key={JSON.stringify({query: term.query, schemas: term.schemas.map((s) => s.name)})}
            onClick={() => handleRecentSearchClick(term)}
          >
            <Button
              style={{width: '100%'}}
              justify={'flex-start'}
              mode="bleed"
              icon={ClockIcon}
              text={
                <Box wrap="wrap" style={{whiteSpace: 'normal'}}>
                  <strong>"{term.query}"</strong> in <SchemaNames schemas={term.schemas} />
                </Box>
              }
            />
          </MenuItem>
        ))}
    </Stack>
  )
}

function title(schemaType: SchemaType) {
  return schemaType.title ?? schemaType.name
}

function SchemaNames({schemas}: {schemas: SchemaType[]}) {
  if (!schemas.length) {
    return <>all document types</>
  }
  if (schemas.length === 1) {
    return <strong>{title(schemas[0])}</strong>
  }
  return (
    <>
      {schemas.map((schemaType, i) => {
        const titleString = title(schemaType)
        const element = <strong key={titleString}>{titleString}</strong>
        if (i < schemas.length - 2) {
          return <React.Fragment key={titleString}>{element}, </React.Fragment>
        } else if (i === schemas.length - 1) {
          return <React.Fragment key={titleString}> and {element}</React.Fragment>
        }
        return element
      })}
    </>
  )
}
