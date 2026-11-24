import {Hotkeys} from '@sanity/ui'
import {Tooltip, type TooltipProps} from '@sanity/ui/tooltip'
import {type ReactNode} from 'react'
import {Box, Flex, Text} from 'ui5'

import * as themeStyles from './themeTokens.module.css'

export type VisionTooltipProps = Omit<TooltipProps, 'arrow' | 'content' | 'padding' | 'portal'> & {
  /** A label, laid out like Studio's own tooltips, or richer content, given the same padding */
  content: ReactNode
  /**
   * Keys of the control's shortcut, already named for the platform (`VISION_SHORTCUTS`), shown
   * as keycaps after a string `content`
   */
  hotkeys?: string[]
}

/**
 * The redesign's tooltip, padded and sized like the tooltips of Studio itself (its navbar's, for
 * one): a card with a 4px padding around a label with 4px of its own, in small trimmed text, and
 * any hotkeys inline after the label, outside its padding so they do not make the card taller
 */
export function VisionTooltip(props: VisionTooltipProps) {
  const {animate = true, content, hotkeys, ...rest} = props
  return (
    <Tooltip
      animate={animate}
      arrow={false}
      content={
        typeof content === 'string' ? (
          <Flex alignItems="center" className={themeStyles.themeTokens}>
            <Box flexBasis="0%" flexGrow={1} padding={1}>
              <Text as="div" size={1} trim={true}>
                {content}
              </Text>
            </Box>
            {hotkeys && (
              <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
                <Hotkeys keys={hotkeys} />
              </Box>
            )}
          </Flex>
        ) : (
          <Box className={themeStyles.themeTokens} padding={1}>
            {content}
          </Box>
        )
      }
      padding={1}
      portal
      {...rest}
    />
  )
}
