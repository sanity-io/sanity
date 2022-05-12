import React from 'react'
import {Box, Flex, Spinner, Text} from '@sanity/ui'

export function LoadingContent() {
  return (
    <Flex align="center" justify="center">
      <Spinner muted />
      <Box marginTop={3}>
        <Text align="center">Loading changes…</Text>
      </Box>
    </Flex>
  )
}
