import React from 'react'
import {Flex} from '@sanity/ui'
import {Tooltip} from '../../../../ui'

interface TextTooltipProps {
  children: React.ReactNode
  text?: string
}

export function TextTooltip(props: TextTooltipProps) {
  const {children, text} = props

  return (
    <Tooltip portal placement="top" content={text}>
      <Flex>{children}</Flex>
    </Tooltip>
  )
}
