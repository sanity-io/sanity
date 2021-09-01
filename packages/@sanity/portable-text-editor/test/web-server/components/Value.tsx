import React from 'react'
import {Card, Heading, Code, Box} from '@sanity/ui'
import {PortableTextBlock} from '../../../src/index'

type Props = {value: PortableTextBlock[] | undefined}

export function Value({value}: Props) {
  return (
    <Card>
      <Box paddingBottom={4}>
        <Heading as="h2" size={1}>
          Value
        </Heading>
      </Box>
      <Box>
        <Code size={1} language="json" id="pte-value">
          {JSON.stringify(value, null, 2)}
        </Code>
      </Box>
    </Card>
  )
}
