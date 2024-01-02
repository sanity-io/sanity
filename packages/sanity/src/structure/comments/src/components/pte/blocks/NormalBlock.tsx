import React from 'react'
import {Flex, Text} from '@sanity/ui'
import styled from 'styled-components'

const NormalText = styled(Text)`
  word-break: break-word;
`

interface NormalBlockProps {
  children: React.ReactNode
}

export function NormalBlock(props: NormalBlockProps) {
  const {children} = props

  return <NormalText size={1}>{children}</NormalText>
  return (
    <Flex>
      <Text size={1}>{children}</Text>
    </Flex>
  )
}
