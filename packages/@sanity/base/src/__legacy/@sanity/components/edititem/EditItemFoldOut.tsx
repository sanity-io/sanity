import {Modifier} from '@popperjs/core'
import {Layer, Portal, useLayer} from '@sanity/ui'
import CloseIcon from 'part:@sanity/base/close-icon'
import DefaultButton from 'part:@sanity/components/buttons/default'
import styles from 'part:@sanity/components/edititem/fold-style'
import React, {forwardRef, useEffect, useState} from 'react'
import {usePopper} from 'react-popper'
import {useZIndex} from '../../../../components'

interface EditItemFoldOutProps {
  title?: string
  children: React.ReactNode
  onClose?: () => void
  referenceElement?: HTMLElement | null
  style?: React.CSSProperties
}

const sameWidthModifier: Modifier<'sameWidth', any> = {
  name: 'sameWidth',
  enabled: true,
  phase: 'beforeWrite',
  requires: ['computeStyles'],
  fn({state}) {
    state.styles.popper.width = `${state.rects.reference.width}px`
  },
}

export default EditItemFoldOut

const EditItemFoldOutChildren = forwardRef(
  (
    props: {onClose?: () => void; title?: string} & Omit<React.HTMLProps<HTMLDivElement>, 'title'>,
    ref
  ) => {
    const {children, onClose, title, ...restProps} = props
    const layer = useLayer()
    const isTopLayer = layer.zIndex === layer.size

    useEffect(() => {
      if (!isTopLayer) return undefined

      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          if (onClose) onClose()
        }
      }

      window.addEventListener('keydown', handleGlobalKeyDown)

      return () => {
        window.removeEventListener('keydown', handleGlobalKeyDown)
      }
    }, [isTopLayer, onClose])

    return (
      <div {...restProps} className={styles.root} ref={ref as any}>
        <div className={styles.card}>
          <Layer className={styles.header}>
            <div className={styles.header__title}>{title}</div>
            <div className={styles.header__actions}>
              <DefaultButton icon={CloseIcon} kind="simple" onClick={onClose} padding="small" />
            </div>
          </Layer>

          <div className={styles.content}>{children}</div>
        </div>
      </div>
    )
  }
)

EditItemFoldOutChildren.displayName = 'EditItemFoldOutChildren'

function EditItemFoldOut(props: EditItemFoldOutProps) {
  const zindex = useZIndex()
  const {title = '', onClose, children, referenceElement: referenceElementProp, style = {}} = props
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)
  const popperReferenceElement = referenceElementProp || referenceElement

  const popper = usePopper(popperReferenceElement, popperElement, {
    placement: 'bottom',
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          rootBoundary: 'viewport',
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, -4],
        },
      },
      sameWidthModifier,
    ],
  })

  const {forceUpdate} = popper

  // Force update when `children` or `referenceElement` changes
  useEffect(() => {
    if (forceUpdate) forceUpdate()
  }, [forceUpdate, children, popperReferenceElement])

  const popperNode = (
    <Portal>
      <Layer zOffset={zindex.portal}>
        <EditItemFoldOutChildren
          onClose={onClose}
          ref={setPopperElement}
          style={{...popper.styles.popper, ...(style || {})}}
          title={title}
          {...popper.attributes.popper}
        >
          {children}
        </EditItemFoldOutChildren>
      </Layer>
    </Portal>
  )

  return (
    <>
      <div ref={setReferenceElement} />
      {popperNode}
    </>
  )
}
