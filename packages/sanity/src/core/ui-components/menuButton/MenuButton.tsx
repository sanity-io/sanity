/* eslint-disable no-restricted-imports */
import {
  PopoverProps,
  MenuButton as UIMenuButton,
  MenuButtonProps as UIMenuButtonProps,
} from '@sanity/ui'
import React, {forwardRef} from 'react'

/** @internal */
export type MenuButtonProps = Omit<UIMenuButtonProps, 'popover'> & {
  popover?: Omit<PopoverProps, 'animate' | 'content' | 'open'>
}

/**
 * Customized Sanity UI <MenuButton> that enforces popover animation.
 *
 * @internal
 */
export const MenuButton = forwardRef(function MenuButton(
  props: MenuButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  return (
    <UIMenuButton
      {...props}
      ref={ref}
      popover={{
        ...props.popover,
        animate: true,
      }}
    />
  )
})
