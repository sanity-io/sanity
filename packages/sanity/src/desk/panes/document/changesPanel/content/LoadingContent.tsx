import React from 'react'
import {Box, Flex, Spinner, Text} from '@sanity/ui'
import {Delay} from '../../../../components'

export function LoadingContent() {
  return (
    <Delay ms={300}>
      <Flex align="center" direction="column" height="fill" justify="center" paddingTop={3}>
        <Spinner muted />
        <Box marginTop={3}>
          <Text align="center" muted size={1}>
            Loading changes
          </Text>
        </Box>
      </Flex>
    </Delay>
  )
}
