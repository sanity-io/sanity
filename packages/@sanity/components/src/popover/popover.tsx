import classNames from 'classnames'
import React, {cloneElement, forwardRef, useEffect, useRef, useState} from 'react'
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
      className,
      content,
      disabled,
      placement = 'bottom',
      style,
      targetElement,
      ...restProps
    } = props
    const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
      targetElement || null
    )
    const targetElementRef = useRef<HTMLElement | null>(targetElement || null)
    const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)
    const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null)
    const popper = usePopper(referenceElement, popperElement, {
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

    useEffect(() => {
      if (targetElement && targetElementRef.current !== targetElement) {
        setReferenceElement(targetElement)
      }

      targetElementRef.current = targetElement || null
    }, [targetElement])

    // Force update when `content` or `referenceElement` changes
    useEffect(() => {
      if (forceUpdate) forceUpdate()
    }, [forceUpdate, content, referenceElement])

    if (disabled) {
      return props.children || <></>
    }

    const children =
      props.children && targetElement === undefined
        ? cloneElement(props.children, {ref: setReferenceElement})
        : props.children || <></>

    const setReference = (el: HTMLDivElement | null) => {
      setPopperElement(el)
      setRef(ref as any, el)
    }

    return (
      <>
        {children}

        {props.open && (
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
        )}
      </>
    )
  }
)

Popover.displayName = 'Popover'
