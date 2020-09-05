/* eslint-disable react/require-default-props */

import Button from 'part:@sanity/components/buttons/default'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback} from 'react'
import {Placement} from '../types'

interface MenuButtonProps {
  boundaryElement?: HTMLElement | null
  buttonProps?: {
    kind?: 'simple' | 'secondary'
    color?: 'primary' | 'success' | 'danger' | 'white' | 'warning'
    onBlur?: () => void
    onClick?: () => void
    children?: React.ReactNode
    inverted?: boolean
    icon?: React.ComponentType<{}>
    loading?: boolean
    className?: string
    disabled?: boolean
    tabIndex?: number
    padding?: 'large' | 'default' | 'small' | 'none'
    bleed?: boolean
    selected?: boolean
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large'
  }
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
      {(ref: React.MutableRefObject<HTMLDivElement>) => (
        <div {...restProps} ref={ref}>
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
