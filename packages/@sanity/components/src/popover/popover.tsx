import classNames from 'classnames'
import React, {cloneElement, useState} from 'react'
import {usePopper} from 'react-popper'
import {PopoverArrow} from './arrow'

import styles from './popover.css'

interface PopoverProps {
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
  tone?: 'navbar'
}

export function Popover(props: PopoverProps) {
  const {className, disabled, placement = 'bottom'} = props
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
          padding: 8
        }
      },
      {
        name: 'offset',
        options: {
          offset: [0, 4]
        }
      }
    ]
  })

  if (disabled) {
    return props.children
  }

  return (
    <>
      {cloneElement(props.children, {ref: setReferenceElement})}

      {props.open && (
        <div
          className={classNames(styles.root, className)}
          ref={setPopperElement as any}
          style={popperStyles.popper}
          {...attributes.popper}
        >
          <div className={styles.card}>{props.content}</div>
          <PopoverArrow data-placement={placement} style={popperStyles.arrow} />
        </div>
      )}
    </>
  )
}
