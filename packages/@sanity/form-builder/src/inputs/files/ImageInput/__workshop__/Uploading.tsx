import {Button, Card, Text, Code, Flex, Inline} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

const ProgressBar = styled(Card)`
  background-color: ${({theme}) => theme.sanity.color.spot.blue};
`

export function Uploading() {
  return (
    <Card tone="primary" padding={4} border>
      <Flex align="center" justify="center" height="fill" direction="column" gap={2}>
        <Inline space={2}>
          <Text size={1}>Uploading</Text>
          <Code size={1}>some-file-name.jpg</Code>
        </Inline>
        <Card marginBottom={3} style={{width: '50%', position: 'relative'}} radius={5} shadow={1}>
          <ProgressBar radius={5} style={{height: '0.5rem', width: '50%'}} />
        </Card>
        <Button fontSize={2} text="Cancel upload" mode="ghost" tone="critical" />
      </Flex>
    </Card>
  )
}
