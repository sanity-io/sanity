import classNames from 'classnames'
import React, {useState} from 'react'
import {usePopper} from 'react-popper'
import {Arrow} from './arrow'

import styles from './tooltip.css'

export interface TooltipProps {
  children: React.ReactElement
  className?: string
  content: React.ReactNode
  disabled: boolean
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
  tone?: 'navbar'
}

export function Tooltip(props: TooltipProps) {
  const {className, disabled, placement = 'bottom', tone} = props
  const [referenceElement, setReferenceElement] = useState(null)
  const [popperElement, setPopperElement] = useState(null)
  const {styles: popperStyles, attributes} = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [
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

  if (disabled) {
    return props.children
  }

  return (
    <>
      {React.cloneElement(props.children, {onMouseEnter, onMouseLeave, ref: setReferenceElement})}
      {isOpen && (
        <div
          className={classNames(styles.root, className)}
          data-tone={tone}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={setPopperElement as any}
          style={popperStyles.popper}
          {...attributes.popper}
        >
          {props.content}
          <Arrow data-placement={placement} style={popperStyles.arrow} tone={tone} />
        </div>
      )}
    </>
  )
}
