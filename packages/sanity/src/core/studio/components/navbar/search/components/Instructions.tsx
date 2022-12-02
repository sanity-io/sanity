import {ControlsIcon} from '@sanity/icons'
import {Flex, Inline, Text} from '@sanity/ui'
import React from 'react'

export function Instructions() {
  return (
    <Flex align="center" direction="column" gap={4} paddingX={4} paddingY={5}>
      <Inline space={3}>
        <Text muted>Use</Text>
        <Text muted>
          <ControlsIcon />
        </Text>
        <Text muted>to refine your search</Text>
      </Inline>
    </Flex>
  )
}
