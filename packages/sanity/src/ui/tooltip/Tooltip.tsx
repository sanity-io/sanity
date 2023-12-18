/* eslint-disable no-restricted-imports */
import {
  Box,
  Flex,
  Hotkeys,
  HotkeysProps,
  Text,
  Tooltip as UITooltip,
  TooltipProps as UITooltipProps,
} from '@sanity/ui'
import React, {forwardRef} from 'react'
import {TOOLTIP_DELAY_PROPS} from './constants'

/** @internal */
export type TooltipProps = Omit<UITooltipProps, 'arrow' | 'padding' | 'shadow'> & {
  hotkeys?: HotkeysProps['keys']
}

const TOOLTIP_SHARED_PROPS: UITooltipProps = {
  animate: true,
  arrow: false,
  boundaryElement: null,
  delay: TOOLTIP_DELAY_PROPS,
  fallbackPlacements: ['bottom-start', 'bottom-end', 'top-start', 'top-end'],
  placement: 'bottom',
  portal: true,
}

/**
 * Customized Sanity UI <Tooltip> with limited layout options and support for showing hotkeys.
 *
 * In just about all cases, its strongly recommended that you pass a string to the `content` prop.
 * This helps simplify i18n and encourages short and concise.
 *
 * Passing ReactNode values to `content` is supported, but discouraged.
 *
 * @internal
 */
export const Tooltip = forwardRef(function Tooltip(
  props: TooltipProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {content, hotkeys, ...rest} = props

  if (typeof content === 'string') {
    return (
      <UITooltip
        {...TOOLTIP_SHARED_PROPS}
        content={
          <Flex align="center">
            {content && (
              <Box flex={1} padding={1}>
                <Text size={1}>{content}</Text>
              </Box>
            )}
            {hotkeys && (
              <Box flex="none">
                <Hotkeys keys={hotkeys} />
              </Box>
            )}
          </Flex>
        }
        padding={1}
        ref={ref}
        {...rest}
      />
    )
  }

  return <UITooltip {...TOOLTIP_SHARED_PROPS} content={content} ref={ref} {...rest} />
})
