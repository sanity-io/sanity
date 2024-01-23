/* eslint-disable no-restricted-imports */
import {Tab as UITab, TabProps as UITabProps} from '@sanity/ui'
import React, {forwardRef} from 'react'

/**
 * @internal
 *
 * Padding and font sizes are fixed in Studio UI <Tab> components.
 */
export type TabProps = Pick<
  UITabProps,
  'aria-controls' | 'focused' | 'icon' | 'id' | 'label' | 'selected' | 'tone'
>

/**
 * Customized Sanity UI <Tab> with limited layout options.
 *
 * @internal
 */
export const Tab = forwardRef(function Tab(
  {tone = 'default', ...props}: TabProps & Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'size'>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  return <UITab {...props} muted padding={2} ref={ref} tone={tone} />
})
