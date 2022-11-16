import {Box, Dialog} from '@sanity/ui'
import React, {useId} from 'react'
import {ConfirmDialog} from './dialogs/ConfirmDialog'
import {ModalDialog} from './dialogs/ModalDialog'
import {PopoverDialog} from './dialogs/PopoverDialog'
import {DocumentActionDialogProps} from 'sanity'

export interface ActionStateDialogProps {
  dialog: DocumentActionDialogProps
  referenceElement?: HTMLElement | null
}

export function ActionStateDialog(props: ActionStateDialogProps) {
  const {dialog, referenceElement = null} = props
  const modalId = useId()

  if (dialog.type === 'confirm') {
    return <ConfirmDialog dialog={dialog} referenceElement={referenceElement} />
  }

  if (dialog.type === 'popover') {
    return <PopoverDialog dialog={dialog} referenceElement={referenceElement} />
  }

  if (dialog.type === 'dialog' || !dialog.type) {
    return <ModalDialog dialog={dialog} />
  }

  // @todo: add validation?
  const unknownModal: any = dialog

  // eslint-disable-next-line no-console
  console.warn(`Unsupported modal type ${unknownModal.type}`)

  return (
    <Dialog
      id={modalId}
      // eslint-disable-next-line react/jsx-handler-names
      onClose={unknownModal.onClose}
      // eslint-disable-next-line react/jsx-handler-names
      onClickOutside={unknownModal.onClose}
      width={2}
    >
      <Box padding={4}>
        {unknownModal.content || (
          <>
            Unexpected modal type (<code>{unknownModal.type}</code>)
          </>
        )}
      </Box>
    </Dialog>
  )
}
