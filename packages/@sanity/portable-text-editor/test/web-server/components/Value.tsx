import React from 'react'
import {PortableTextBlock} from '@sanity/types'
import {Card, Heading, Code, Box} from '@sanity/ui'

type Props = {value: PortableTextBlock[] | undefined; revId: string}

export function Value({value, revId}: Props) {
  return (
    <Card>
      <Box paddingBottom={4}>
        <Heading as="h2" size={1} data-rev-id={revId}>
          Value
        </Heading>
      </Box>
      <Box>
        <Code as="code" size={1} language="json" id="pte-value" data-rev-id={revId}>
          {JSON.stringify(value, null, 2)}
        </Code>
      </Box>
    </Card>
  )
}
