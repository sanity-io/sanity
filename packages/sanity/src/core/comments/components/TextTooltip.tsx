import React from 'react'
import {Flex, Text, Tooltip} from '@sanity/ui'

interface TextTooltipProps {
  children: React.ReactNode
  text?: string
}

export function TextTooltip(props: TextTooltipProps) {
  const {children, text} = props

  return (
    <Tooltip
      delay={{open: 500}}
      portal
      placement="top"
      // @todo: there appears to be an issue with `fallbackPlacements` and tooltips in sanity UI `1.8.2`
      // fallbackPlacements={['bottom']}
      content={
        <Text size={1} style={{whiteSpace: 'nowrap'}}>
          {text}
        </Text>
      }
      padding={2}
    >
      <Flex>{children}</Flex>
    </Tooltip>
  )
}
