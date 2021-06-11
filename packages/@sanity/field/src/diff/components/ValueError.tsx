import * as React from 'react'
import {Text, Box, Card, Flex} from '@sanity/ui'
import {ErrorOutlineIcon} from '@sanity/icons'
import {FieldValueError} from '../../validation'

export function ValueError({error}: {error: FieldValueError}) {
  return (
    <Card tone="critical" padding={3}>
      <Flex align="flex-start">
        <Box>
          <Text>
            <ErrorOutlineIcon />
          </Text>
        </Box>
        <Box paddingLeft={3}>
          <Text size={1} as="p">
            Value error: {error.message}
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}
