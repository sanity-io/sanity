// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {useLayer} from '@sanity/ui'
import classNames from 'classnames'
import {Portal} from 'part:@sanity/components/portal'
import React, {useCallback, useEffect, useState} from 'react'
import {usePopper} from 'react-popper'
import {LegacyLayerProvider} from '../../../../components'
import {TooltipArrow} from './tooltipArrow'
import {useTooltip} from './hooks'
import {TooltipPlacement} from './types'

import styles from './tooltip.css'

export interface TooltipProps {
  children?: React.ReactElement
  className?: string
  content: React.ReactNode
  disabled?: boolean
  placement?: TooltipPlacement
  portal?: boolean
  tone?: 'navbar'
  allowedAutoPlacements?: TooltipPlacement[]
  fallbackPlacements?: TooltipPlacement[]
}

export function Tooltip(props: TooltipProps & React.HTMLProps<HTMLDivElement>) {
  const {
    allowedAutoPlacements,
    children,
    className,
    content,
    disabled,
    fallbackPlacements,
    placement = 'bottom',
    portal: portalProp,
    tone,
    ...restProps
  } = props

  const ctx = useTooltip()
  const [isOpen, setIsOpen] = useState(false)
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
          padding: 4,
        },
      },
      {
        name: 'preventOverflow',
        options: {
          altAxis: true,
          boundary: ctx.boundaryElement || undefined,
          padding: 4,
        },
      },
      {
        name: 'offset',
        options: {offset: [0, 3]},
      },
      {
        name: 'flip',
        options: {
          allowedAutoPlacements,
          fallbackPlacements,
        },
      },
    ],
  })
  const {forceUpdate} = popper
  const handleBlur = useCallback(() => setIsOpen(false), [setIsOpen])
  const handleFocus = useCallback(() => setIsOpen(true), [setIsOpen])
  const handleMouseEnter = useCallback(() => setIsOpen(true), [setIsOpen])
  const handleMouseLeave = useCallback(() => setIsOpen(false), [setIsOpen])

  useEffect(() => {
    if (forceUpdate) forceUpdate()
  }, [forceUpdate, content])

  if (disabled) {
    return children || <></>
  }

  const popperNode = isOpen && (
    <LegacyLayerProvider zOffset="tooltip">
      <TooltipPopper
        {...restProps}
        {...popper.attributes.popper}
        arrowStyle={popper.styles.arrow}
        className={className}
        content={content}
        setArrowElement={setArrowElement}
        setPopperElement={setPopperElement}
        style={popper.styles.popper}
        tone={tone}
      />
    </LegacyLayerProvider>
  )

  return (
    <>
      {children &&
        React.cloneElement(children, {
          onBlur: handleBlur,
          onFocus: handleFocus,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
          ref: setReferenceElement,
        })}

      {portalProp && <Portal>{popperNode}</Portal>}
      {!portalProp && popperNode}
    </>
  )
}

function TooltipPopper(
  props: React.HTMLProps<HTMLDivElement> & {
    arrowStyle: React.CSSProperties
    content: React.ReactNode
    setArrowElement: (el: HTMLDivElement | null) => void
    setPopperElement: (el: HTMLDivElement | null) => void
    tone?: 'navbar'
  }
) {
  const {
    arrowStyle,
    className,
    content,
    setArrowElement,
    setPopperElement,
    style,
    tone,
    ...restProps
  } = props

  const {zIndex} = useLayer()

  return (
    <div
      {...restProps}
      className={classNames(styles.root, className)}
      data-tone={tone}
      ref={setPopperElement}
      style={{...style, zIndex}}
    >
      <div className={styles.card}>{content}</div>
      <TooltipArrow ref={setArrowElement} style={arrowStyle} tone={tone} />
    </div>
  )
}
