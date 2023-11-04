/* eslint-disable no-restricted-imports */
import {Tooltip as UITooltip, TooltipProps as UITooltipProps, Text} from '@sanity/ui'
import React, {forwardRef} from 'react'

/** @internal */
export interface TooltipProps extends UITooltipProps {
  ref?: React.ForwardedRef<HTMLDivElement>
}

const TOOLTIP_DELAY_PROPS = {
  open: 500,
}

/**
 * Studio UI <Tooltip>.
 *
 * Studio UI components are opinionated `@sanity/ui` components meant for internal use only.
 * Props and options are intentionally limited to ensure consistency and ease of use.
 *
 * @internal
 */
export const Tooltip = forwardRef(function Tooltip(
  props: TooltipProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {content, ...rest} = props

  return (
    <UITooltip
      content={
        typeof content === 'string' || typeof content === 'number' ? (
          <Text size={1} weight="medium">
            {content}
          </Text>
        ) : (
          content
        )
      }
      delay={TOOLTIP_DELAY_PROPS}
      ref={ref}
      {...rest}
    />
  )
})
