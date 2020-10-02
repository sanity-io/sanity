import {Modifier} from '@popperjs/core'
import CloseIcon from 'part:@sanity/base/close-icon'
import DefaultButton from 'part:@sanity/components/buttons/default'
import styles from 'part:@sanity/components/edititem/fold-style'
import {Portal} from 'part:@sanity/components/portal'
import React, {useEffect, useState} from 'react'
import {usePopper} from 'react-popper'
import Escapable from '../utilities/Escapable'
import Stacked from '../utilities/Stacked'

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
  }
}

export default EditItemFoldOut

function EditItemFoldOut(props: EditItemFoldOutProps) {
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
          rootBoundary: 'viewport'
        }
      },
      {
        name: 'offset',
        options: {
          offset: [0, -4]
        }
      },
      sameWidthModifier
    ]
  })

  const {forceUpdate} = popper

  // Force update when `children` or `referenceElement` changes
  useEffect(() => {
    if (forceUpdate) forceUpdate()
  }, [forceUpdate, children, popperReferenceElement])

  const popperNode = (
    <Stacked>
      {isActive => (
        <div
          className={styles.root}
          ref={setPopperElement}
          style={{...popper.styles.popper, ...(style || {})}}
          {...popper.attributes.popper}
        >
          <Escapable onEscape={event => (isActive || event.shiftKey) && onClose && onClose()} />

          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.header__title}>{title}</div>
              <div className={styles.header__actions}>
                <DefaultButton icon={CloseIcon} kind="simple" onClick={onClose} padding="small" />
              </div>
            </div>

            <div className={styles.content}>{children}</div>
          </div>
        </div>
      )}
    </Stacked>
  )

  return (
    <>
      <div ref={setReferenceElement} />
      <Portal>{popperNode}</Portal>
    </>
  )
}
