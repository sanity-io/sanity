/* eslint-disable no-restricted-imports */
import {MenuGroup as UIMenuGroup, MenuGroupProps as UIMenuGroupProps} from '@sanity/ui'
import React from 'react'

/** @internal */
export type MenuGroupProps = Pick<UIMenuGroupProps, 'icon' | 'popover' | 'text' | 'tone'> &
  Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref' | 'tabIndex'>

/**
 * Studio UI <MenuGroup>.
 *
 * Studio UI components are opinionated `@sanity/ui` components meant for internal use only.
 * Props and options are intentionally limited to ensure consistency and ease of use.
 *
 * @internal
 */
export const MenuGroup = (props: MenuGroupProps) => {
  return <UIMenuGroup {...props} fontSize={1} padding={3} />
}
