import {
  Text,
  Tooltip as UITooltip,
  TooltipProps as UITooltipProps,
  HotkeysProps as UIHotkeysProps,
  Hotkeys,
} from '@sanity/ui'
import React from 'react'

/** @internal */
export interface TooltipProps
  extends Pick<UITooltipProps, 'children' | 'disabled' | 'placement' | 'scheme' | 'portal'>,
    Pick<UIHotkeysProps, 'keys'> {
  text: string //should be optional? because hotkeys can be used without text
}

/**
 * Studio UI <Tooltip>.
 *
 * Studio UI components are opinionated `@sanity/ui` components meant for internal use only.
 * Props and options are intentionally limited to ensure consistency and ease of use.
 *
 * @internal
 */
export const Tooltip = ({text, ...rest}: TooltipProps) => {
  return (
    <UITooltip
      content={
        <>
          {text && (
            <Text size={1} weight="medium">
              {text}
            </Text>
          )}
          {rest.keys && <Hotkeys keys={rest.keys} />}
        </>
      }
      {...rest}
      portal
    />
  )
}
