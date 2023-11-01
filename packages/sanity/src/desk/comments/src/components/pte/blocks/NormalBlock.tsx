import React from 'react'
import {Flex, Text} from '@sanity/ui'
import styled from 'styled-components'

const NormalText = styled(Text)`
  word-break: break-word;
`

interface NormalBlockProps {
  children: React.ReactNode
}

/**
 * @beta
 * @hidden
 */
export function NormalBlock(props: NormalBlockProps) {
  const {children} = props

  return <NormalText size={1}>{children}</NormalText>
}
