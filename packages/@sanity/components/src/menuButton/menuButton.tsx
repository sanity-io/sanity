import Button from 'part:@sanity/components/buttons/default'
import {Popover} from 'part:@sanity/components/popover'
import Escapable from 'part:@sanity/components/utilities/escapable'
import React, {forwardRef, useCallback, useState} from 'react'
import {ButtonProps} from '../buttons'
import {useClickOutside} from '../hooks'
import {Placement} from '../types'

interface MenuButtonProps {
  boundaryElement?: HTMLElement | null
  buttonProps?: ButtonProps
  menu?: React.ReactNode
  open?: boolean
  placement?: Placement
  portal?: boolean
  setOpen: (val: boolean) => void
}

export const MenuButton = forwardRef(
  (props: MenuButtonProps & React.HTMLProps<HTMLDivElement>, ref) => {
    const {
      boundaryElement,
      buttonProps,
      children,
      menu,
      open,
      placement,
      portal,
      setOpen,
      ...restProps
    } = props

    const handleClose = useCallback(() => setOpen(false), [setOpen])
    const handleButtonClick = useCallback(() => setOpen(!open), [open, setOpen])
    const [buttonContainerElement, setButtonContainerElement] = useState<HTMLDivElement | null>(
      null
    )
    const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)

    useClickOutside(handleClose, [buttonContainerElement, popoverElement])

    return (
      <div {...restProps} ref={ref as any}>
        <Popover
          boundaryElement={boundaryElement}
          content={menu}
          open={open}
          placement={placement}
          portal={portal}
          ref={setPopoverElement}
        >
          <div ref={setButtonContainerElement}>
            <Button {...buttonProps} onClick={handleButtonClick}>
              {children}
            </Button>
          </div>
        </Popover>

        {open && <Escapable onEscape={handleClose} />}
      </div>
    )
  }
)

MenuButton.displayName = 'MenuButton'
