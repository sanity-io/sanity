/* eslint-disable no-restricted-imports */
import {
  TooltipDelayGroupProvider as UITooltipDelayGroupProvider,
  type TooltipDelayGroupProviderProps as UITooltipDelayGroupProviderProps,
} from '@sanity/ui'

import {TOOLTIP_DELAY_PROPS} from '../tooltip/constants'

/** @internal */
export type TooltipDelayGroupProviderProps = Omit<UITooltipDelayGroupProviderProps, 'delay'>

/**
 * Opinionated Sanity UI <TooltipDelayGroupProvider> which forces the same delay to all tooltips.
 *
 * @internal
 */
export const TooltipDelayGroupProvider = (props: TooltipDelayGroupProviderProps) => {
  return (
    <UITooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
      {props.children}
    </UITooltipDelayGroupProvider>
  )
}
