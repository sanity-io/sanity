import Button from 'part:@sanity/components/buttons/default'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback} from 'react'
import {ButtonProps} from '../buttons'
import {Placement} from '../types'

interface MenuButtonProps {
  boundaryElement?: HTMLElement | null
  buttonProps?: ButtonProps
  menu?: React.ReactNode
  placement?: Placement
  open?: boolean
  setOpen: (val: boolean) => void
}

export function MenuButton(props: MenuButtonProps & React.HTMLProps<HTMLDivElement>) {
  const {
    boundaryElement,
    buttonProps,
    children,
    menu,
    open,
    placement,
    setOpen,
    ...restProps
  } = props

  const handleClickOutside = useCallback(() => setOpen(false), [setOpen])
  const handleButtonClick = useCallback(() => setOpen(!open), [open, setOpen])

  return (
    <ClickOutside onClickOutside={handleClickOutside}>
      {ref => (
        <div {...restProps} ref={ref as React.Ref<HTMLDivElement>}>
          <Popover
            boundaryElement={boundaryElement}
            content={menu as any}
            open={open}
            placement={placement}
          >
            <div>
              <Button {...buttonProps} onClick={handleButtonClick}>
                {children}
              </Button>
            </div>
          </Popover>
        </div>
      )}
    </ClickOutside>
  )
}
