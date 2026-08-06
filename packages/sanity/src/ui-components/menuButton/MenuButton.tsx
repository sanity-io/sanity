/* oxlint-disable no-restricted-imports */
import {
  MenuButton as UIMenuButton,
  type MenuButtonProps as UIMenuButtonProps,
  type PopoverProps,
} from '@sanity/ui'
import {type RefAttributes} from 'react'

/** @internal */
export type MenuButtonProps = Omit<UIMenuButtonProps, 'popover'> & {
  popover?: Omit<PopoverProps, 'animate' | 'content' | 'open'>
}

/**
 * Customized Sanity UI <MenuButton> that enforces popover animation.
 *
 * @internal
 */
export function MenuButton(props: MenuButtonProps & RefAttributes<HTMLButtonElement>) {
  const {ref, ...rest} = props
  return (
    <UIMenuButton
      {...rest}
      ref={ref}
      popover={{
        ...props.popover,
        animate: true,
      }}
    />
  )
}
