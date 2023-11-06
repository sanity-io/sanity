/* eslint-disable no-restricted-imports */
import {Tooltip as UITooltip, TooltipProps as UITooltipProps, Text} from '@sanity/ui'
import React, {forwardRef} from 'react'

/** @internal */
export type TooltipProps = Omit<UITooltipProps, 'padding'>

const TOOLTIP_DELAY_PROPS = {
  open: 400,
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
          <Text size={1}>{content}</Text>
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
