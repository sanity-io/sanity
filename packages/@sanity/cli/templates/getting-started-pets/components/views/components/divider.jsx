import React from 'react'
import {Flex, Heading} from '@sanity/ui'

export function Divider() {
  return (
    <Flex justify="center" marginY={4}>
      <Heading align="center" size={4}>
        ***
      </Heading>
    </Flex>
  )
}
