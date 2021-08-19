import React from 'react'
import {Stack, Spinner, Text} from '@sanity/ui'

export function SearchLoading() {
  return (
    <Stack space={4}>
      <Text align="center">
        <Spinner muted />
      </Text>
      <Text align="center" muted>
        Searching...
      </Text>
    </Stack>
  )
}
