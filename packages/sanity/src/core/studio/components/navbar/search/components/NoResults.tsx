import {Container, Stack, Text} from '@sanity/ui'
import React from 'react'

export function NoResults() {
  return (
    <Container width={0}>
      <Stack aria-live="assertive" space={4} paddingX={4} paddingY={5}>
        <Text align="center" muted weight="semibold">
          No results found
        </Text>
        <Text align="center" muted size={1}>
          Try another keyword or adjust your filters
        </Text>
      </Stack>
    </Container>
  )
}
