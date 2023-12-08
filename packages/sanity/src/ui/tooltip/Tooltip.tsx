/* eslint-disable no-restricted-imports */
import {
  Box,
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
  const {content, hotkeys, placement = 'bottom', portal = true, ...rest} = props

  return (
    <UITooltip
      animate
      arrow={false}
      boundaryElement={null}
      content={
        <Flex align="center">
          {content && (
            <Box flex={1} padding={1}>
              <Text size={1} weight="medium">
                {content}
              </Text>
            </Box>
          )}
          {hotkeys && (
            <Box flex="none">
              <Hotkeys keys={hotkeys} />
            </Box>
          )}
        </Flex>
      }
      delay={TOOLTIP_DELAY_PROPS}
      fallbackPlacements={TOOLTIP_FALLBACK_PLACEMENTS}
      padding={1}
      portal={portal}
      ref={ref}
      placement={placement}
      {...rest}
    />
  )
})
