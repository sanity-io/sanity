import React from 'react'
import {Flex, Text} from '@sanity/ui'

interface NormalBlockProps {
  children: React.ReactNode
}

export function NormalBlock(props: NormalBlockProps) {
  const {children} = props

  return (
    <Text size={1} style={{wordBreak: 'break-word'}}>
      {children}
    </Text>
  )
  return (
    <Flex>
      <Text size={1}>{children}</Text>
    </Flex>
  )
}
