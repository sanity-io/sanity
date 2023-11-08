/* eslint-disable no-restricted-imports */
import {Tooltip as UITooltip, TooltipProps as UITooltipProps} from '@sanity/ui'
import React, {forwardRef} from 'react'
import {TOOLTIP_DELAY_PROPS} from './constants'

/** @internal */
export type TooltipWithNodesProps = UITooltipProps

/**
 * Studio UI <TooltipWithNodes>.
 *
 * This is a just a regular 'full fat' Sanity UI <Tooltip> component with default
 * open delay applied.
 *
 * This may be deprecated in future as we look to simplify studio tooltip usage in general.
 *
 * @internal
 */
export const TooltipWithNodes = forwardRef(function Tooltip(
  props: TooltipWithNodesProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return <UITooltip delay={TOOLTIP_DELAY_PROPS} ref={ref} {...props} />
})
