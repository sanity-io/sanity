import {
  Box,
  Flex,
  type HotkeysProps,
  Text,
  // eslint-disable-next-line no-restricted-imports
  Tooltip as UITooltip,
  // eslint-disable-next-line no-restricted-imports
  type TooltipProps as UITooltipProps,
} from '@sanity/ui'
import {type ForwardedRef, forwardRef, memo, useMemo} from 'react'

import {Hotkeys} from '../../core/components/Hotkeys'
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

const TooltipComponent = forwardRef(function Tooltip(
  props: TooltipProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {content, hotkeys, ...rest} = props

  const memoizedContent = useMemo(() => {
    if (typeof content === 'string') {
      return (
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
      )
    }

    return content
  }, [content, hotkeys])

  return (
    <UITooltip
      {...TOOLTIP_SHARED_PROPS}
      content={memoizedContent}
      padding={1}
      ref={ref}
      {...rest}
    />
  )
})
TooltipComponent.displayName = 'ForwardRef(Tooltip)'
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
export const Tooltip = memo(TooltipComponent)
