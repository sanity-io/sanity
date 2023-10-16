import {Text, Tooltip as UITooltip, TooltipProps as UITooltipProps} from '@sanity/ui'
import React from 'react'

export interface TooltipProps
  extends Pick<UITooltipProps, 'children' | 'disabled' | 'placement' | 'scheme'> {
  text: string
}

/**
 * Studio UI <Tooltip>.
 *
 * Studio UI components are opinionated `@sanity/ui` components meant for internal use only.
 * Props and options are intentionally limited to ensure consistency and ease of use.
 *
 * @internal
 */
export const Tooltip = ({children, disabled, placement, scheme, text}: TooltipProps) => {
  return (
    <UITooltip
      content={
        <Text size={1} weight="medium">
          {text}
        </Text>
      }
      disabled={disabled}
      placement={placement}
      scheme={scheme}
    >
      {children}
    </UITooltip>
  )
}
