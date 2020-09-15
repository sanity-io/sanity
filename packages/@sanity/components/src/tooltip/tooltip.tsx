import classNames from 'classnames'
import {Portal} from 'part:@sanity/components/portal'
import React, {useEffect, useState} from 'react'
import {usePopper} from 'react-popper'
import {TooltipPlacement} from './types'
import {TooltipArrow} from './tooltipArrow'

import styles from './tooltip.css'

export interface TooltipProps {
  children: React.ReactElement
  className?: string
  content: React.ReactNode
  disabled?: boolean
  placement?: TooltipPlacement
  portal?: boolean
  tone?: 'navbar'
}

export function Tooltip(
  props: TooltipProps & Omit<React.HTMLProps<HTMLDivElement>, 'children' | 'content'>
) {
  const {
    children,
    className,
    content,
    disabled,
    placement = 'bottom',
    portal: portalProp,
    tone,
    ...restProps
  } = props
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null)
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
          rootBoundary: 'viewport',
          padding: 4
        }
      },
      {
        name: 'offset',
        options: {offset: [0, 3]}
      }
    ]
  })

  const [isOpen, setIsOpen] = useState(false)
  const onMouseEnter = () => setIsOpen(() => true)
  const onMouseLeave = () => setIsOpen(() => false)

  const {forceUpdate} = popper

  useEffect(() => {
    if (forceUpdate) forceUpdate()
  }, [forceUpdate, content])

  if (disabled) {
    return children
  }

  const popperNode = (
    <div
      {...restProps}
      className={classNames(styles.root, className)}
      data-tone={tone}
      ref={setPopperElement}
      style={popper.styles.popper}
      {...popper.attributes.popper}
    >
      <div className={styles.card}>{content}</div>
      <TooltipArrow ref={setArrowElement} style={popper.styles.arrow} tone={tone} />
    </div>
  )

  return (
    <>
      {React.cloneElement(children, {onMouseEnter, onMouseLeave, ref: setReferenceElement})}
      {isOpen && (
        <>
          {portalProp && <Portal>{popperNode}</Portal>}
          {!portalProp && popperNode}
        </>
      )}
    </>
  )
}
