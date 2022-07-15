import {useRovingFocus} from '@sanity/base/components'
import {Box, Button, Stack} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {Instructions} from './Instructions'
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
        <Stack
          padding={1}
          ref={setFocusRootElement}
          space={1}
          style={{
            opacity: result.loading ? 0.5 : 1,
            transition: '300ms opacity',
          }}
        >
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
        <Instructions />
      )}
    </Box>
  )
}
