import classNames from 'classnames'
import {Portal} from 'part:@sanity/components/portal'
import React, {cloneElement, forwardRef, useCallback, useEffect, useState} from 'react'
import {usePopper} from 'react-popper'
import maxSize from 'popper-max-size-modifier'
import {Placement} from '../types'
import {PopoverArrow} from './popoverArrow'

import styles from './popover.css'

function setRef<T = unknown>(ref: (v: T) => void | React.MutableRefObject<T> | null, val: T) {
  if (typeof ref === 'object' && ref !== null) (ref as any).current = val
  if (typeof ref === 'function') ref(val)
}

interface PopoverProps {
  arrowClassName?: string
  boundaryElement?: HTMLElement | null
  cardClassName?: string
  children?: React.ReactElement
  className?: string
  content?: React.ReactNode
  disabled?: boolean
  open?: boolean
  placement?: Placement
  portal?: boolean
  targetElement?: HTMLElement | null
  tone?: 'navbar'
}

export const Popover = forwardRef(
  (
    props: PopoverProps & Omit<React.HTMLProps<HTMLDivElement>, 'children' | 'content'>,
    ref
  ): React.ReactElement => {
    const {
      arrowClassName,
      boundaryElement,
      cardClassName,
      children,
      className,
      content,
      disabled,
      open,
      placement = 'bottom',
      portal: portalProp,
      style,
      targetElement,
      ...restProps
    } = props
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
            padding: 4
          }
        },
        {
          name: 'preventOverflow',
          options: {
            altAxis: true,
            boundary: boundaryElement || undefined,
            padding: 8
          }
        },
        {
          name: 'offset',
          options: {
            offset: [0, 4]
          }
        },
        {
          ...maxSize,
          options: {
            padding: 8
          }
        }
      ]
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

    const popperNode = open && (
      <div
        {...restProps}
        className={classNames(styles.root, className)}
        ref={setReference}
        style={{...popper.styles.popper, ...(style || {})}}
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

    return (
      <>
        {children && !targetElement
          ? cloneElement(children, {ref: setReferenceElement})
          : children || <></>}

        {portalProp && <Portal>{popperNode}</Portal>}
        {!portalProp && popperNode}
      </>
    )
  }
)

Popover.displayName = 'Popover'
