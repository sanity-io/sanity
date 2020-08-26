import Button from 'part:@sanity/components/buttons/default'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback} from 'react'

interface MenuButtonProps {
  // @todo: typings
  buttonProps?: any
  menu?: React.ReactNode
  placement?: string
  open?: boolean
  setOpen?: (val: boolean) => void
}

export function MenuButton(props: MenuButtonProps & React.HTMLProps<HTMLDivElement>) {
  const {buttonProps, children, menu, open, placement, setOpen, ...restProps} = props
  const handleClickOutside = useCallback(() => {
    if (!setOpen) return
    setOpen(false)
  }, [setOpen])

  const handleButtonClick = useCallback(() => {
    if (!setOpen) return
    setOpen(!open)
  }, [open, setOpen])

  return (
    <ClickOutside onClickOutside={handleClickOutside}>
      {ref => (
        <div {...restProps} ref={ref}>
          <Popover content={menu} open={open} placement={placement}>
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
