import classNames from 'classnames'
import React, {cloneElement, useEffect, useRef, useState} from 'react'
import {usePopper} from 'react-popper'
import {Modifier} from '@popperjs/core'
import maxSize from 'popper-max-size-modifier'
import {Placement} from '../types'
import {PopoverArrow} from './popoverArrow'

import styles from './popover.css'

const applyModifer: Modifier<'applyMaxSize', Record<string, unknown>> = {
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
  children: React.ReactElement
  className?: string
  content?: React.ReactNode
  disabled?: boolean
  open?: boolean
  placement?: Placement
  targetElement?: HTMLElement | null
  tone?: 'navbar'
}

export function Popover(
  props: PopoverProps & Omit<React.HTMLProps<HTMLDivElement>, 'children' | 'content'>
) {
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
      },
      applyModifer
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
    return props.children
  }

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
