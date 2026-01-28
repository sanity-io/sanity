/* eslint-disable no-restricted-imports */
import {Tab as UITab, type TabProps as UITabProps} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type HTMLProps} from 'react'

/**
 * @internal
 *
 * Padding and font sizes are fixed in Studio UI <Tab> components.
 */
export type TabProps = Pick<
  UITabProps,
  'aria-controls' | 'focused' | 'icon' | 'id' | 'label' | 'selected' | 'tone'
> & {
  /**
   * Icon right does't exist as a prop yet in Sanity UI <Tab> component.
   * But the Tab is at the end a button, and a button can have an icon right.
   * So we can use this prop to add an icon right to the Tab.
   * PR to update sanity ui https://github.com/sanity-io/ui/pull/2173
   */
  iconRight?: React.ReactNode
}

/**
 * Customized Sanity UI <Tab> with limited layout options.
 *
 * @internal
 */
export const Tab = forwardRef(function Tab(
  {tone = 'default', ...props}: TabProps & Omit<HTMLProps<HTMLButtonElement>, 'as' | 'size'>,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return <UITab {...props} muted padding={2} ref={ref} tone={tone} />
})
