import {StateLink} from '@sanity/state-router'
import {Card, Container, Heading, Stack, Text} from '@sanity/ui'
import React from 'react'

export function NotFound() {
  return (
    <Container width={1}>
      <Card padding={4} shadow={1} tone="critical">
        <Stack space={4}>
          <Heading as="h1">Page not found</Heading>
          <Text>
            <StateLink toIndex>Go to index</StateLink>
          </Text>
        </Stack>
      </Card>
    </Container>
  )
}
