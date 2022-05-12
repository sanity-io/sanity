import {useId} from '@reach/auto-id'
import {Box, Dialog} from '@sanity/ui'
import React from 'react'
import {DocumentActionModalProps} from '../../../actions'
import {ConfirmDialog} from './dialogs/ConfirmDialog'
// import {DeprecatedErrorDialog} from './dialogs/DeprecatedErrorDialog'
// import {DeprecatedSuccessDialog} from './dialogs/DeprecatedSuccessDialog'
import {ModalDialog} from './dialogs/ModalDialog'
import {PopoverDialog} from './dialogs/PopoverDialog'

export interface ActionStateDialogProps {
  modal: DocumentActionModalProps
  referenceElement?: HTMLElement | null
}

export function ActionStateDialog(props: ActionStateDialogProps) {
  const {modal, referenceElement = null} = props
  const modalId = useId() || ''

  // @todo: rename this type type "component" or "node"?
  // if (modal.type === 'legacy') {
  //   return <>{modal.content}</>
  // }

  if (modal.type === 'confirm') {
    return <ConfirmDialog modal={modal} referenceElement={referenceElement} />
  }

  if (modal.type === 'dialog') {
    return <ModalDialog modal={modal} />
  }

  if (modal.type === 'popover') {
    return <PopoverDialog modal={modal} referenceElement={referenceElement} />
  }

  // if (modal.type === 'success') {
  //   return <DeprecatedSuccessDialog modal={modal} />
  // }

  // if (modal.type === 'error') {
  //   return <DeprecatedErrorDialog modal={modal} />
  // }

  // @todo: add validation?
  const unknownModal: any = modal

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
