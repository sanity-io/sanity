import {Card, Stack, Text} from '@sanity/ui'
import React, {memo} from 'react'
import {ProductCounter} from './ProductCounter'

export const NeverUpdate = memo(function NeverUpdate() {
  return (
    <Card padding={4} shadow={1}>
      <Stack space={4}>
        <Text size={1}>
          Hello, this is a component that never updates. It includs another component that depends
          on router state.
        </Text>
        <ProductCounter />
      </Stack>
    </Card>
  )
})
