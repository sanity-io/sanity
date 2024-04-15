/* eslint-disable no-restricted-imports */
import {
  MenuButton as UIMenuButton,
  type MenuButtonProps as UIMenuButtonProps,
  type PopoverProps,
} from '@sanity/ui'
import {type ForwardedRef, forwardRef} from 'react'

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
  ref: ForwardedRef<HTMLButtonElement>,
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
