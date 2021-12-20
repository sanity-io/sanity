import {Button, Card, Text, Code, Flex, Inline, Stack} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

const ProgressBar = styled(Card)`
  background-color: ${({theme}) => theme.sanity.color.spot.blue};
`

export function Uploading() {
  return (
    <Card tone="primary" padding={[4, 4, 3]} border>
      <Flex
        align="center"
        justify="center"
        height="fill"
        gap={[3, 3, 2]}
        direction={['column', 'column', 'row']}
      >
        <Flex
          gap={2}
          flex={1}
          direction="column"
          align="center"
          height="stretch"
          justify="space-between"
        >
          <Inline space={3}>
            <Text size={1}>Uploading</Text>
            <Code size={1}>some-file-name.jpg</Code>
          </Inline>
          <Card style={{width: '80%', position: 'relative'}} radius={5} shadow={1}>
            <ProgressBar radius={5} style={{height: '0.5rem', width: '50%'}} />
          </Card>
        </Flex>
        <Button fontSize={2} text="Cancel upload" mode="ghost" tone="critical" />
      </Flex>
    </Card>
  )
}
