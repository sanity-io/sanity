import Button from 'part:@sanity/components/buttons/default'
import {useLayer} from 'part:@sanity/components/layer'
import {Popover} from 'part:@sanity/components/popover'
import React, {forwardRef, useCallback, useEffect, useState} from 'react'
import {ButtonProps} from '../buttons'
import {useClickOutside} from '../hooks'
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
    const layer = useLayer()
    const isTopLayer = layer.depth === layer.size
    const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        setRootElement(el)
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
      },
      [ref]
    )

    useClickOutside(
      useCallback(() => {
        if (!isTopLayer) return
        onClose()
      }, [isTopLayer, onClose]),
      [rootElement]
    )

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
          layer={portal}
          portal={portal}
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
