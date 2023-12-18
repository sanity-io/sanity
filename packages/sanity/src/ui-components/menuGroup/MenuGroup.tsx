/* eslint-disable no-restricted-imports */
import {MenuGroup as UIMenuGroup, MenuGroupProps as UIMenuGroupProps} from '@sanity/ui'
import React from 'react'

/** @internal */
export type MenuGroupProps = Pick<UIMenuGroupProps, 'icon' | 'popover' | 'text' | 'tone'>

/**
 * Customized Sanity UI <MenuGroup> component with pre-defined layout options.
 *
 * @internal
 */
export const MenuGroup = (
  props: MenuGroupProps &
    Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref' | 'tabIndex'>,
) => {
  return <UIMenuGroup {...props} fontSize={1} padding={3} />
}
