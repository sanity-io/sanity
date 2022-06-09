import {Popover, useClickOutside, useGlobalKeyDown, useLayer} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {DocumentActionPopoverModalProps} from '../../../../actions'
import {POPOVER_FALLBACK_PLACEMENTS} from './constants'

export function PopoverDialog(props: {
  modal: DocumentActionPopoverModalProps
  referenceElement: HTMLElement | null
}) {
  const {modal, referenceElement} = props

  return (
    <Popover
      content={<PopoverDialogContent modal={modal} />}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      open
      placement="top"
      portal
      preventOverflow
      referenceElement={referenceElement}
    />
  )
}

function PopoverDialogContent(props: {modal: DocumentActionPopoverModalProps}) {
  const {modal} = props
  const {content, onClose} = modal
  const {isTopLayer} = useLayer()
  const [element, setElement] = useState<HTMLElement | null>(null)

  const handleClickOutside = useCallback(() => {
    if (isTopLayer) onClose()
  }, [isTopLayer, onClose])

  const handleGlobalKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape' && isTopLayer) onClose()
    },
    [isTopLayer, onClose]
  )

  useClickOutside(handleClickOutside, [element])
  useGlobalKeyDown(handleGlobalKeyDown)

  return <div ref={setElement}>{content}</div>
}
