import React from 'react'
import {Box, Flex, Spinner, Text} from '@sanity/ui'

export function LoadingContent() {
  return (
    <Flex align="center" direction="column" gap={4} justify="center">
      <Box marginTop={3}>
        <Text align="center" muted size={1}>
          Loading changes…
        </Text>
      </Box>
      <Spinner muted />
    </Flex>
  )
}
