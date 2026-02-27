/* eslint-disable no-restricted-imports */
import {MenuGroup as UIMenuGroup, type MenuGroupProps as UIMenuGroupProps} from '@sanity/ui'
import {type HTMLProps} from 'react'

import {Tooltip, type TooltipProps} from '../tooltip/Tooltip'

/** @internal */
export type MenuGroupProps = Pick<UIMenuGroupProps, 'icon' | 'popover' | 'text' | 'tone'>

/**
 * Customized Sanity UI <MenuGroup> component with pre-defined layout options.
 *
 * @internal
 */
export const MenuGroup = (
  props: MenuGroupProps &
    Omit<HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref' | 'tabIndex' | 'popover'> & {
      tooltipProps?: TooltipProps | null
    },
) => {
  const {tooltipProps} = props

  const children = <UIMenuGroup {...props} fontSize={1} padding={3} />

  if (tooltipProps) {
    return (
      <Tooltip content={tooltipProps?.content} portal {...tooltipProps}>
        {/* This div is needed to make the tooltip work in disabled menu items */}
        <div>{children}</div>
      </Tooltip>
    )
  }

  return children
}
