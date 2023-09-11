import React from 'react'
import {Box, Flex, Text, Tooltip} from '@sanity/ui'
import styled from 'styled-components'

const TextBox = styled(Box)`
  // There is currently an issue with the Tooltip component in @sanity/ui where it
  // animates the tooltip width on mount when it needs to reposition itself.
  // Adding a the CSS below to the tooltip content prevents this from happening.
  width: max-content;
`

interface TextTooltipProps {
  children: React.ReactNode
  text?: string
}

export function TextTooltip(props: TextTooltipProps) {
  const {children, text} = props

  return (
    <Tooltip
      portal
      placement="top"
      fallbackPlacements={['bottom']}
      content={
        <TextBox padding={2} sizing="border">
          <Text size={1}>{text}</Text>
        </TextBox>
      }
    >
      <Flex>{children}</Flex>
    </Tooltip>
  )
}
