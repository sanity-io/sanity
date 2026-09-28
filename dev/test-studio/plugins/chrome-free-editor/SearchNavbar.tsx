import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Container, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {SearchProvider, SearchResultItemPreview, useSchema, useSearchState} from 'sanity'
import {useRouter} from 'sanity/router'

type OnSelectDocument = (id: string, type: string) => void

function SearchResults({onSelect}: {onSelect: OnSelectDocument}): React.JSX.Element | null {
  const {state} = useSearchState()
  const schema = useSchema()
  const {hits, loading} = state.result

  if (loading) {
    return (
      <Box padding={3}>
        <Text muted size={1}>
          Searching…
        </Text>
      </Box>
    )
  }

  if (hits.length === 0) return null

  return (
    <Stack>
      {hits.slice(0, 8).map(({hit}) => {
        const schemaType = schema.get(hit._type)
        if (!schemaType) return null
        return (
          <Card
            key={hit._id}
            as="button"
            padding={2}
            radius={2}
            onClick={() => onSelect(hit._id, hit._type)}
            data-testid="chrome-free-search-result"
          >
            <SearchResultItemPreview
              documentId={hit._id}
              documentType={hit._type}
              schemaType={schemaType}
            />
          </Card>
        )
      })}
    </Stack>
  )
}

function SearchField({onSelect}: {onSelect: OnSelectDocument}): React.JSX.Element {
  const {dispatch} = useSearchState()
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => dispatch({type: 'TERMS_QUERY_SET', query}), 300)
    return () => clearTimeout(timer)
  }, [query, dispatch])

  const handleSelect = useCallback(
    (id: string, type: string) => {
      setQuery('')
      onSelect(id, type)
    },
    [onSelect],
  )

  return (
    <Stack gap={2}>
      <TextInput
        data-testid="chrome-free-search-input"
        icon={SearchIcon}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Search articles"
        radius={2}
        value={query}
      />
      {query.length > 1 && <SearchResults onSelect={handleSelect} />}
    </Stack>
  )
}

export function SearchNavbar(): React.JSX.Element {
  const router = useRouter()

  const handleSelect = useCallback(
    (id: string, type: string) => router.navigateIntent('edit', {id, type}),
    [router],
  )

  return (
    <Card borderBottom padding={3} data-testid="chrome-free-navbar">
      <Flex justify="center">
        <Container width={1}>
          <SearchProvider>
            <SearchField onSelect={handleSelect} />
          </SearchProvider>
        </Container>
      </Flex>
    </Card>
  )
}
