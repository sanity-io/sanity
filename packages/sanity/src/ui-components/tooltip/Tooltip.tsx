import {Flex, type HotkeysProps, Text} from '@sanity/ui'
import {
  // oxlint-disable-next-line no-restricted-imports
  Tooltip as UITooltip,
  // oxlint-disable-next-line no-restricted-imports
  type TooltipProps as UITooltipProps,
} from '@sanity/ui/tooltip'
import {type RefAttributes} from 'react'
import {Box} from 'ui5'

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
export function Tooltip(props: TooltipProps & RefAttributes<HTMLDivElement>) {
  const {ref, content, hotkeys, ...rest} = props

  if (typeof content === 'string') {
    return (
      <UITooltip
        {...TOOLTIP_SHARED_PROPS}
        content={
          <Flex align="center">
            {content && (
              <Box flexBasis="0%" flexGrow={1} padding={1}>
                <Text size={1}>{content}</Text>
              </Box>
            )}
            {hotkeys && (
              <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
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
}
