import {
  Popover, // eslint-disable-line no-restricted-imports
  useClickOutsideEvent,
  useGlobalKeyDown,
  useLayer,
} from '@sanity/ui'
import {useCallback, useRef} from 'react'
import {type DocumentActionPopoverDialogProps} from 'sanity'

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
      placement="top"
      portal
      preventOverflow
      referenceElement={referenceElement}
    />
  )
}

/**
 * Popover rendered by custom document actions of dialog type `popover`.
 * As these are user configurable with public facing APIs, internal studio ui-components are not used.
 */
function PopoverDialogContent(props: {dialog: DocumentActionPopoverDialogProps}) {
  const {dialog} = props
  const {content, onClose} = dialog
  const {isTopLayer} = useLayer()
  const ref = useRef<HTMLDivElement | null>(null)

  const handleGlobalKeyDown = useCallback(
    (event: any) => {
      if (event.key === 'Escape' && isTopLayer) onClose()
    },
    [isTopLayer, onClose],
  )

  useGlobalKeyDown(handleGlobalKeyDown)
  useClickOutsideEvent(isTopLayer && onClose, () => [ref.current])

  return <div ref={ref}>{content}</div>
}
