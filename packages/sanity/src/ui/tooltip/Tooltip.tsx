import {Tooltip as UITooltip, TooltipProps as UITooltipProps, Text} from '@sanity/ui'
import React, {forwardRef} from 'react'

/** @internal */
export interface TooltipProps extends UITooltipProps {
  ref?: React.ForwardedRef<HTMLDivElement>
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

  if (typeof content === 'string') {
    return (
      <UITooltip
        content={<Text size={1} weight="medium">{content}</Text>}
        delay={{open: 500}}
        ref={ref}
        {...rest}
      />
    )
  }

  return <UITooltip delay={{open: 500}} ref={ref} content={content} {...rest} />
})
