import {TextWithTone} from '@sanity/base/components'
import {BulbOutlineIcon} from '@sanity/icons'
import {Box, Button, Flex, Inline, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {addSearchTerm} from './local-storage/search-store'
import {SearchResultItem} from './SearchResultItem'
import {SemiboldSpan} from './SemiboldSpan'
import {useOmnisearch} from './state/OmnisearchContext'
import {TypeNames} from './TypeNames'

interface SearchResultsProps {
  onRecentSearchClick?: () => void
}

export function SearchResults(props: SearchResultsProps) {
  const {onRecentSearchClick} = props

  const {
    dispatch,
    onClose,
    state: {terms, result},
  } = useOmnisearch()

  const handleLoadMore = useCallback(() => {
    dispatch({type: 'PAGE_INCREMENT'})
  }, [dispatch])

  const handleResultClick = useCallback(() => {
    addSearchTerm(terms)
    // setRecentSearches(getRecentSearchTerms(schema))
    onClose()
  }, [onClose, terms])

  return (
    <Box>
      {result.hits.length ? (
        // Has search results
        <Stack padding={1}>
          {result.hits.map((hit) => (
            <SearchResultItem key={hit.hit._id} hit={hit} onClick={handleResultClick} />
          ))}
          {!result.loading && (
            <Button
              mode="bleed"
              onClick={handleLoadMore}
              text="More"
              title="Load more search results"
            />
          )}
        </Stack>
      ) : (
        // No results
        <Flex align="center" direction="column" gap={4} paddingX={4} paddingY={5}>
          <Text align="center" muted size={2}>
            No results for <SemiboldSpan>“{terms.query}”</SemiboldSpan> in{' '}
            {terms.types.length > 0 ? <TypeNames types={terms.types} /> : 'all document types'}
          </Text>

          {terms.types.length > 0 && (
            <Inline space={2}>
              <TextWithTone size={2} tone="caution">
                <BulbOutlineIcon />
              </TextWithTone>
              <TextWithTone align="center" size={1} tone="caution">
                Try adjusting the document type filter
              </TextWithTone>
            </Inline>
          )}
        </Flex>
      )}
    </Box>
  )
}
