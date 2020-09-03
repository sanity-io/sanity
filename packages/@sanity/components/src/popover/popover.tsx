/* eslint-disable react/require-default-props */

import classNames from 'classnames'
import React, {cloneElement, useState, useEffect} from 'react'
import {usePopper} from 'react-popper'
import {Modifier} from '@popperjs/core'
import maxSize from 'popper-max-size-modifier'
import {PopoverArrow} from './arrow'

import styles from './popover.css'

const applyModifer: Modifier<'applyMaxSize', {}> = {
  name: 'applyMaxSize',
  enabled: true,
  phase: 'beforeWrite',
  requires: ['maxSize'],
  fn({state}) {
    const {height} = state.modifiersData.maxSize
    state.styles.popper.maxHeight = `${height}px`
  }
}

interface PopoverProps {
  boundaryElement?: HTMLElement | null
  children: JSX.Element
  className?: string
  content: React.ReactNode
  disabled: boolean
  open?: boolean
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
  targetElement?: HTMLElement | null
  tone?: 'navbar'
}

export function Popover(props: PopoverProps & Omit<React.HTMLProps<HTMLDivElement>, 'children'>) {
  const {
    boundaryElement,
    className,
    content,
    disabled,
    placement = 'bottom',
    style,
    targetElement,
    ...restProps
  } = props
  const [referenceElement, setReferenceElement] = useState(null)
  const [popperElement, setPopperElement] = useState(null)
  const [arrowElement, setArrowElement] = useState(null)
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
      },
      applyModifer
    ]
  })

  if (disabled) {
    return props.children
  }

  useEffect(() => {
    if (targetElement) {
      setReferenceElement(targetElement)
    }
  }, [targetElement])

  useEffect(() => {
    if (popper.forceUpdate) popper.forceUpdate()
  }, [content])

  const children =
    targetElement === undefined
      ? cloneElement(props.children, {ref: setReferenceElement})
      : props.children

  return (
    <>
      {children}

      {props.open && (
        <div
          {...restProps}
          className={classNames(styles.root, className)}
          ref={setPopperElement}
          style={{...popper.styles.popper, ...(style || {})}}
          {...popper.attributes.popper}
        >
          <div className={styles.card}>{content}</div>
          <PopoverArrow ref={setArrowElement} style={popper.styles.arrow} />
        </div>
      )}
    </>
  )
}
