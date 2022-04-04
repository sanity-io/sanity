import React from 'react'
import {Flex, Spinner, Card, Text} from '@sanity/ui'

export function LoadingScreen() {
  return (
    // TODO: improve the design of this
    // think about having it load in the `_document` too
    <Flex as={Card} justify="center" align="center" height="fill" direction="column" gap={4}>
      <Text muted>Loading…</Text>
      <Spinner muted />
    </Flex>
  )
}
