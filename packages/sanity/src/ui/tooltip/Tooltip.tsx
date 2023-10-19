import {Tooltip as UITooltip, TooltipProps as UITooltipProps} from '@sanity/ui'
import React from 'react'

/** @internal */
export type TooltipProps = UITooltipProps

/**
 * Studio UI <Tooltip>.
 *
 * Studio UI components are opinionated `@sanity/ui` components meant for internal use only.
 * Props and options are intentionally limited to ensure consistency and ease of use.
 *
 * @internal
 */
export const Tooltip = ({...rest}: UITooltipProps) => {
  return <UITooltip delay={{open: 500}} {...rest} />
}
