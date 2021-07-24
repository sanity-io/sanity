import {DocumentActionPopoverDialogProps} from '@sanity/base'
import {Popover, useClickOutside, useGlobalKeyDown, useLayer} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {POPOVER_FALLBACK_PLACEMENTS} from './constants'

export function PopoverDialog(props: {
  dialog: DocumentActionPopoverDialogProps
  referenceElement: HTMLElement | null
}) {
  const {dialog, referenceElement} = props

  return (
    <Popover
      content={<PopoverDialogContent dialog={dialog} />}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      open
      placement="left-end"
      portal
      referenceElement={referenceElement}
    />
  )
}

function PopoverDialogContent(props: {dialog: DocumentActionPopoverDialogProps}) {
  const {dialog} = props
  const {content, onClose} = dialog
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
