import classNames from 'classnames'
import {Modifier} from '@popperjs/core'
import React, {forwardRef, useCallback, useEffect, useState} from 'react'
import {usePopper} from 'react-popper'
import {Layer, useLayer} from 'part:@sanity/components/layer'
import {Portal} from 'part:@sanity/components/portal'
import {useClickOutside} from '../hooks'
import {Placement} from '../types'

import styles from './Poppable.css'

type PopperModifiers = ReadonlyArray<Partial<Modifier<string, unknown>>>

interface PoppableProps {
  onEscape?: () => void
  onClickOutside?: (ev: MouseEvent) => void
  children?: React.ReactNode
  referenceClassName?: string
  referenceElement?: HTMLElement
  placement?: Placement
  positionFixed?: boolean
  popperClassName?: string
  modifiers?: PopperModifiers
}

const DEFAULT_MODIFIERS: PopperModifiers = [
  {
    name: 'preventOverflow',
    options: {
      rootBoundary: 'viewport'
    }
  }
]

export default Poppable

const PoppableChildren = forwardRef(
  (
    props: {
      onEscape?: () => void
      onClickOutside?: (ev: MouseEvent) => void
      popperClassName?: string
    } & React.HTMLProps<HTMLDivElement>,
    ref
  ) => {
    const {children, onEscape, onClickOutside, popperClassName, ...restProps} = props
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
      (event: Event) => {
        if (!isTopLayer) return
        if (onClickOutside) onClickOutside(event as MouseEvent)
      },
      [rootElement]
    )

    useEffect(() => {
      if (!isTopLayer) return undefined

      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          if (onEscape) onEscape()
        }
      }

      window.addEventListener('keydown', handleGlobalKeyDown)

      return () => {
        window.removeEventListener('keydown', handleGlobalKeyDown)
      }
    }, [isTopLayer, onEscape])

    return (
      <div {...restProps} className={classNames(styles.root, popperClassName)} ref={setRef}>
        {children}
      </div>
    )
  }
)

PoppableChildren.displayName = 'PoppableChildren'

function Poppable(props: PoppableProps) {
  const {
    onEscape,
    onClickOutside,
    children,
    referenceClassName,
    modifiers = DEFAULT_MODIFIERS,
    placement = 'bottom-start',
    popperClassName,
    referenceElement: referenceElementProp
  } = props

  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)
  const popperReferenceElement = referenceElementProp || referenceElement

  const popper = usePopper(popperReferenceElement, popperElement, {
    placement,
    modifiers
  })

  const {forceUpdate} = popper

  // Force update when `content` or `referenceElement` changes
  useEffect(() => {
    if (forceUpdate) forceUpdate()
  }, [forceUpdate, children, popperReferenceElement])

  return (
    <>
      {!referenceElementProp && <div ref={setReferenceElement} className={referenceClassName} />}

      {children && (
        <Portal>
          <Layer className={styles.layer}>
            <PoppableChildren
              onEscape={onEscape}
              onClickOutside={onClickOutside}
              popperClassName={popperClassName}
              ref={setPopperElement}
              style={{...popper.styles.popper}}
              {...popper.attributes.popper}
            >
              {children}
            </PoppableChildren>
          </Layer>
        </Portal>
      )}
    </>
  )
}
