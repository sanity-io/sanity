/* eslint-disable no-restricted-imports */
import {
  Flex,
  Hotkeys,
  HotkeysProps,
  Placement,
  Text,
  Tooltip as UITooltip,
  TooltipProps as UITooltipProps,
} from '@sanity/ui'
import React, {forwardRef} from 'react'
import {TOOLTIP_DELAY_PROPS} from './constants'

/** @internal */
export type TooltipProps = Omit<UITooltipProps, 'content' | 'padding'> & {
  content?: string | null
  hotkeys?: HotkeysProps['keys']
}

const TOOLTIP_FALLBACK_PLACEMENTS: Placement[] = [
  'bottom-start',
  'bottom-end',
  'top-start',
  'top-end',
]

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
  const {content, hotkeys, ...rest} = props

  return (
    <UITooltip
      arrow={false}
      boundaryElement={null}
      content={
        <Flex align="center" gap={3}>
          {content && <Text size={1}>{content}</Text>}
          {hotkeys && (
            <Hotkeys fontSize={1} keys={hotkeys} style={{marginTop: -4, marginBottom: -4}} />
          )}
        </Flex>
      }
      delay={TOOLTIP_DELAY_PROPS}
      fallbackPlacements={TOOLTIP_FALLBACK_PLACEMENTS}
      ref={ref}
      placement="bottom"
      {...rest}
    />
  )
})
