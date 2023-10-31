import {ButtonTone, Tab as UITab, TabProps as UITabProps} from '@sanity/ui'
import React, {forwardRef} from 'react'

/**
 * @internal
 *
 * Icons are not supported in the Studio UI <Tab> component.
 * Padding and font size are fixed.
 *
 */
export type TabProps = Pick<
  UITabProps,
  'id' | 'label' | 'aria-controls' | 'tone' | 'selected' | 'focused'
> & {
  size?: 'default' | 'small'
}

const smallTabProps = {
  padding: 2,
  muted: true,
  tone: 'positive' as ButtonTone,
}

const defaultTabProps = {
  padding: 3,
  muted: true,
  tone: 'positive' as ButtonTone,
}

/**
 * Studio UI <Tab>.
 *
 * Studio UI components are opinionated `@sanity/ui` components meant for internal use only.
 * Props and options are intentionally limited to ensure consistency and ease of use.
 *
 * @internal
 */
export const Tab = forwardRef(function Tab(
  {size = 'default', ...props}: TabProps & Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'size'>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  return <UITab {...props} {...(size === 'default' ? defaultTabProps : smallTabProps)} ref={ref} />
})
