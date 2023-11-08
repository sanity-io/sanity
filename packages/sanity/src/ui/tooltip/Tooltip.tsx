/* eslint-disable no-restricted-imports */
import {
  Flex,
  Hotkeys,
  HotkeysProps,
  Text,
  Tooltip as UITooltip,
  TooltipProps as UITooltipProps,
} from '@sanity/ui'
import React, {forwardRef} from 'react'

/** @internal */
export type TooltipProps = Omit<UITooltipProps, 'content' | 'padding'> & {
  content?: string | null
  hotkeys?: HotkeysProps['keys']
}

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
  const {content, hotkeys, ...rest} = props

  return (
    <UITooltip
      content={
        <Flex align="center" gap={3}>
          <Text size={1}>{content}</Text>
          {hotkeys && (
            <Hotkeys fontSize={1} keys={hotkeys} style={{marginTop: -4, marginBottom: -4}} />
          )}
        </Flex>
      }
      delay={TOOLTIP_DELAY_PROPS}
      ref={ref}
      {...rest}
    />
  )
})
