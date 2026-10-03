/* oxlint-disable no-restricted-imports */
import {
  MenuButton as UIMenuButton,
  type MenuButtonProps as UIMenuButtonProps,
} from '@sanity/ui/menu'
import {type PopoverProps} from '@sanity/ui/popover'
import {
  cloneElement,
  type FocusEvent,
  type PointerEvent,
  type RefAttributes,
  useCallback,
  useMemo,
  useState,
} from 'react'

import {useOverlayContentMounted} from '../hooks/useOverlayContentMounted'

/** @internal */
export type MenuButtonProps = Omit<UIMenuButtonProps, 'popover'> & {
  popover?: Omit<PopoverProps, 'animate' | 'content' | 'open'>
}

/** The handlers of the `button` element that the wrapper chains into. */
interface ButtonInteractionProps {
  onBlur?: (event: FocusEvent<HTMLButtonElement>) => void
  onFocus?: (event: FocusEvent<HTMLButtonElement>) => void
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerLeave?: (event: PointerEvent<HTMLButtonElement>) => void
}

/**
 * Customized Sanity UI <MenuButton> that enforces popover animation.
 *
 * The `menu` is only rendered while it is open, or while the user is about to open it (the
 * button is pressed or focused), plus the exit grace of {@link useOverlayContentMounted}. Sanity
 * UI v4 otherwise keeps every closed menu mounted in a hidden `<Activity>`, and a large form has
 * one of these per field and per array item.
 *
 * Sanity UI's `MenuButton` replaces the button's `onClick`, `onKeyDown` and `onMouseDown`, so the
 * wrapper arms the menu from pointer and focus events instead, with `onOpen` as the fallback for
 * an open that was triggered without either (e.g. a synthetic click). The grace also covers touch
 * input, where `pointerleave` fires before the `click` that opens the menu.
 *
 * @internal
 */
export function MenuButton(props: MenuButtonProps & RefAttributes<HTMLButtonElement>) {
  const {ref, button, menu, onClose, onOpen, popover, ...rest} = props
  const [open, setOpen] = useState(false)
  const [armed, setArmed] = useState(false)
  const menuMounted = useOverlayContentMounted(open || armed)

  const handleOpen = useCallback(() => {
    setOpen(true)
    onOpen?.()
  }, [onOpen])

  const handleClose = useCallback(() => {
    setOpen(false)
    onClose?.()
  }, [onClose])

  const armedButton = useMemo(() => {
    const buttonProps: ButtonInteractionProps = button.props

    return cloneElement(button, {
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
        buttonProps.onPointerDown?.(event)
        setArmed(true)
      },
      onFocus: (event: FocusEvent<HTMLButtonElement>) => {
        buttonProps.onFocus?.(event)
        setArmed(true)
      },
      onPointerLeave: (event: PointerEvent<HTMLButtonElement>) => {
        buttonProps.onPointerLeave?.(event)
        setArmed(false)
      },
      onBlur: (event: FocusEvent<HTMLButtonElement>) => {
        buttonProps.onBlur?.(event)
        setArmed(false)
      },
    })
  }, [button])

  const popoverProps = useMemo(() => ({...popover, animate: true}), [popover])

  return (
    <UIMenuButton
      {...rest}
      button={armedButton}
      menu={menuMounted ? menu : undefined}
      onClose={handleClose}
      onOpen={handleOpen}
      popover={popoverProps}
      ref={ref}
    />
  )
}
