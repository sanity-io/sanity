import {useClickOutside, useLayer, Popover} from '@sanity/ui'
import Button from 'part:@sanity/components/buttons/default'
import React, {forwardRef, useCallback, useEffect, useState} from 'react'
import {ButtonProps} from '../buttons'
import {Placement} from '../types'

interface MenuButtonProps {
  boundaryElement?: HTMLElement | null
  buttonContainerClassName?: string
  buttonProps?: ButtonProps
  menu?: React.ReactNode
  open?: boolean
  placement?: Placement
  portal?: boolean
  setOpen: (val: boolean) => void
}

const MenuButtonChildren = forwardRef(
  (props: {onClose: () => void} & React.HTMLProps<HTMLDivElement>, ref) => {
    const {children, onClose, ...restProps} = props
    const {isTopLayer} = useLayer()
    const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        setRootElement(el)
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
      },
      [ref]
    )

    const handleClickOutside = useCallback(() => {
      if (!isTopLayer) return
      onClose()
    }, [isTopLayer, onClose])

    useClickOutside(handleClickOutside, [rootElement])

    useEffect(() => {
      if (!isTopLayer) return undefined

      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
      }

      window.addEventListener('keydown', handleGlobalKeyDown)

      return () => {
        window.removeEventListener('keydown', handleGlobalKeyDown)
      }
    }, [isTopLayer, onClose])

    return (
      <div {...restProps} ref={setRef}>
        {children}
      </div>
    )
  }
)

MenuButtonChildren.displayName = 'MenuButtonChildren'

export const MenuButton = forwardRef(
  (props: MenuButtonProps & React.HTMLProps<HTMLDivElement>, ref) => {
    const {
      boundaryElement,
      buttonContainerClassName,
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

    return (
      <div {...restProps} ref={ref as any}>
        <Popover
          boundaryElement={boundaryElement}
          content={<MenuButtonChildren onClose={handleClose}>{menu}</MenuButtonChildren>}
          open={open}
          placement={placement}
          portal={portal}
          radius={2}
        >
          <div className={buttonContainerClassName}>
            <Button {...buttonProps} onClick={handleButtonClick}>
              {children}
            </Button>
          </div>
        </Popover>
      </div>
    )
  }
)

MenuButton.displayName = 'MenuButton'
