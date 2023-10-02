import React from 'react'
import {Flex, Text, Tooltip, TooltipProps} from '@sanity/ui'
import styled from 'styled-components'

const TOOLTIP_DELAY: TooltipProps['delay'] = {open: 500}

const ContextText = styled(Text)`
  min-width: max-content;
`

interface TextTooltipProps {
  children: React.ReactNode
  text?: string
}

export function TextTooltip(props: TextTooltipProps) {
  const {children, text} = props

  return (
    <Tooltip
      delay={TOOLTIP_DELAY}
      portal
      placement="top"
      // @todo: there appears to be an issue with `fallbackPlacements` and tooltips in sanity UI `1.8.2`
      // fallbackPlacements={['bottom']}
      content={<ContextText size={1}>{text}</ContextText>}
      padding={2}
    >
      <Flex>{children}</Flex>
    </Tooltip>
  )
}
