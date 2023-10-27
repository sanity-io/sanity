import React from 'react'
import {PortableTextBlock} from '@sanity/types'
import {Card, Heading, Code, Box} from '@sanity/ui'

type Props = {value: PortableTextBlock[] | undefined; revId: string}

export function Value({value, revId}: Props) {
  return (
    <Card>
      <Box paddingBottom={4}>
        <Heading as="h2" size={1}>
          Value
        </Heading>
      </Box>
      <Box padding={4} style={{outline: '1px solid #999'}} marginBottom={2}>
        <Code as="code" size={0} language="json" id="pte-value" data-rev-id={revId}>
          {JSON.stringify(value, null, 2)}
        </Code>
      </Box>
      <Box padding={4} style={{outline: '1px solid #999'}}>
        <Code as="code" size={0} language="json" id="pte-revId" data-rev-id={revId}>
          {JSON.stringify({revId})}
        </Code>
      </Box>
    </Card>
  )
}
