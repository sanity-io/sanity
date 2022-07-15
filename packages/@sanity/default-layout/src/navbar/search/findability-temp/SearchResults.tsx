import {useRovingFocus} from '@sanity/base/components'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import pluralize from 'pluralize'
import React, {useCallback, useState} from 'react'
import {addSearchTerm} from './local-storage/search-store'
import {SearchResultItem} from './SearchResultItem'
import {useOmnisearch} from './state/OmnisearchContext'

interface SearchResultsProps {
  onRecentSearchClick?: () => void
}

export function SearchResults(props: SearchResultsProps) {
  const {onRecentSearchClick} = props

  const [focusRootElement, setFocusRootElement] = useState<HTMLDivElement | null>(null)

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

  // Enable keyboard arrow navigation
  useRovingFocus({
    direction: 'vertical',
    initialFocus: 'first',
    loop: false,
    rootElement: focusRootElement,
  })

  return (
    <Box>
      {!!result.hits.length && (
        // (Has search results)
        <Stack padding={1} ref={setFocusRootElement} space={1}>
          {result.hits.map((hit) => (
            <SearchResultItem key={hit.hit._id} hit={hit} onClick={handleResultClick} />
          ))}
          {result.hasMore && (
            <Button
              disabled={result.loading}
              mode="bleed"
              onClick={handleLoadMore}
              text="More"
              title="Load more search results"
            />
          )}
        </Stack>
      )}

      {!result.hits.length && result.loaded && (
        // (No results)
        <Flex align="center" direction="column" gap={4} paddingX={4} paddingY={5}>
          <Text align="center" muted size={2}>
            No results {terms.types.length > 1 ? 'across' : 'in'}{' '}
            {terms.types.length > 0
              ? `${terms.types.length} document ${pluralize('type', terms.types.length)}`
              : 'all document types'}
          </Text>
        </Flex>
      )}
    </Box>
  )
}
