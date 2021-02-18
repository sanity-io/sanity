import {Portal, useLayer} from '@sanity/ui'
import classNames from 'classnames'
import React, {cloneElement, forwardRef, useCallback, useEffect, useState} from 'react'
import {usePopper} from 'react-popper'
import maxSize from 'popper-max-size-modifier'
import {useBoundaryElement} from '../boundaryElement'
import {Placement} from '../types'
import {LegacyLayerProvider} from '../../../../components'
import {PopoverArrow} from './popoverArrow'

import styles from './popover.css'

function setRef<T = unknown>(ref: (v: T) => void | React.MutableRefObject<T> | null, val: T) {
  if (typeof ref === 'object' && ref !== null) (ref as any).current = val
  if (typeof ref === 'function') ref(val)
}

interface PopoverProps {
  allowedAutoPlacements?: Placement[]
  arrowClassName?: string
  boundaryElement?: HTMLElement | null
  cardClassName?: string
  children?: React.ReactElement
  className?: string
  content?: React.ReactNode
  disabled?: boolean
  fallbackPlacements?: Placement[]
  /**
   * @deprecated
   */
  layer?: boolean
  open?: boolean
  placement?: Placement
  portal?: boolean
  targetElement?: HTMLElement | null
  tone?: 'navbar'
}

const PopoverChildren = forwardRef(
  (
    props: PopoverProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'children' | 'content'>,
    ref
  ): React.ReactElement => {
    const {
      allowedAutoPlacements,
      arrowClassName,
      boundaryElement: boundaryElementProp,
      cardClassName,
      children,
      className,
      content,
      disabled,
      fallbackPlacements,
      open,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      layer: _,
      placement = 'bottom',
      portal,
      style,
      targetElement,
      ...restProps
    } = props
    const {zIndex} = useLayer()
    const boundaryElementCtx = useBoundaryElement()
    const boundaryElement = boundaryElementProp || boundaryElementCtx
    const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
    const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)
    const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null)
    const popperReferenceElement = targetElement || referenceElement

    const popper = usePopper(popperReferenceElement, popperElement, {
      placement,
      modifiers: [
        {
          name: 'arrow',
          options: {
            element: arrowElement,
            padding: 4,
          },
        },
        {
          name: 'preventOverflow',
          options: {
            rootBoundary: boundaryElement ? undefined : 'viewport',
            boundary: boundaryElement || 'clippingParents',
            padding: 8,
          },
        },
        {
          name: 'offset',
          options: {
            offset: [0, 4],
          },
        },
        {
          name: 'flip',
          options: {
            rootBoundary: boundaryElement ? undefined : 'viewport',
            boundary: boundaryElement || 'clippingParents',
            allowedAutoPlacements,
            fallbackPlacements,
          },
        },
        {
          ...maxSize,
          options: {
            padding: 8,
          },
        },
      ],
    })

    const {forceUpdate} = popper

    // Force update when `content` or `referenceElement` changes
    useEffect(() => {
      if (forceUpdate) forceUpdate()
    }, [forceUpdate, content, popperReferenceElement])

    const setReference = useCallback(
      (el: HTMLDivElement | null) => {
        setPopperElement(el)
        setRef(ref as any, el)
      },
      [ref]
    )

    if (disabled) {
      return children || <></>
    }

    let popperNode: React.ReactNode = null

    if (open) {
      popperNode = (
        <div
          {...restProps}
          className={classNames(styles.root, className)}
          ref={setReference}
          style={{...popper.styles.popper, ...(style || {}), zIndex}}
          {...popper.attributes.popper}
        >
          <div className={classNames(styles.card, cardClassName)}>{content}</div>
          <PopoverArrow
            className={arrowClassName}
            ref={setArrowElement}
            style={popper.styles.arrow}
          />
        </div>
      )

      if (portal) {
        popperNode = <Portal>{popperNode}</Portal>
      }
    }

    return (
      <>
        {children && !targetElement
          ? cloneElement(children, {ref: setReferenceElement})
          : children || <></>}
        {popperNode}
      </>
    )
  }
)

PopoverChildren.displayName = 'Popover'

export const Popover = forwardRef(
  (
    props: PopoverProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'children' | 'content'>,
    ref
  ) => {
    if (!props.open) {
      return <PopoverChildren {...props} ref={ref} />
    }

    return (
      <LegacyLayerProvider zOffset="popover">
        <PopoverChildren {...props} ref={ref} />
      </LegacyLayerProvider>
    )
  }
)

Popover.displayName = 'Popover'
