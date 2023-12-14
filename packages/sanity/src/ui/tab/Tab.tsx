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
> & {
  size?: 'default' | 'small'
}

const SMALL_TAB_PROPS = {
  padding: 2,
}

const DEFAULT_TAB_PROPS = {
  padding: 3,
}

/**
 * Customized Sanity UI <Tab> with limited layout options.
 *
 * @internal
 */
export const Tab = forwardRef(function Tab(
  {
    size = 'small',
    tone = 'default',
    ...props
  }: TabProps & Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'size'>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  return (
    <UITab
      {...props}
      {...(size === 'default' ? DEFAULT_TAB_PROPS : SMALL_TAB_PROPS)}
      muted
      ref={ref}
      tone={tone}
    />
  )
})
