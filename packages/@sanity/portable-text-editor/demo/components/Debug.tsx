import React from 'react'
import {Card, Heading, Code, Box} from '@sanity/ui'
import {PortableTextBlock} from '../../src/index'

type Props = {value: PortableTextBlock[] | undefined}

export function Debug({value}: Props) {
  return (
    <Card>
      <Box paddingBottom={4}>
        <Heading as="h2" size={1}>
          Value
        </Heading>
      </Box>
      <Box>
        <Code size={1} language="json">
          {value ? JSON.stringify(value, null, 2) : 'Not set'}
        </Code>
      </Box>
    </Card>
  )
}
