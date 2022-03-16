import {withRouter} from '@sanity/state-router'
import {Card, Code, Heading, Label, Stack} from '@sanity/ui'
import React from 'react'

export const ProductCounter = withRouter(function ProductCounter(props) {
  const {router} = props

  return (
    <Card padding={4} shadow={1}>
      <Stack space={4}>
        <Label>Product counter</Label>
        <Heading as="h1">My parent never updates. Should still get router state updates.</Heading>
        <Heading as="h2" size={1}>
          Current router state (scoped)
        </Heading>
        <Code>{JSON.stringify(router.state, null, 2)}</Code>
      </Stack>
    </Card>
  )
})
