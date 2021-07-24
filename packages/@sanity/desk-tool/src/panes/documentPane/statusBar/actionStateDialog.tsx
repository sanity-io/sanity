import {useId} from '@reach/auto-id'
import {DocumentActionDialogProps} from '@sanity/base'
import {Box, Dialog} from '@sanity/ui'
import React from 'react'
import {ConfirmDialog} from './dialogs/ConfirmDialog'
import {DeprecatedErrorDialog} from './dialogs/DeprecatedErrorDialog'
import {DeprecatedSuccessDialog} from './dialogs/DeprecatedSuccessDialog'
import {ModalDialog} from './dialogs/ModalDialog'
import {PopoverDialog} from './dialogs/PopoverDialog'

export interface ActionStateDialogProps {
  dialog: DocumentActionDialogProps
  referenceElement: HTMLElement | null
}

export function ActionStateDialog(props: ActionStateDialogProps) {
  const {dialog, referenceElement} = props
  const dialogId = useId() || ''

  // @todo: rename this type type "component" or "node"?
  if (dialog.type === 'legacy') {
    return <>{dialog.content}</>
  }

  if (dialog.type === 'confirm') {
    return <ConfirmDialog dialog={dialog} referenceElement={referenceElement} />
  }

  if (dialog.type === 'modal') {
    return <ModalDialog dialog={dialog} />
  }

  if (dialog.type === 'popover') {
    return <PopoverDialog dialog={dialog} referenceElement={referenceElement} />
  }

  if (dialog.type === 'success') {
    return <DeprecatedSuccessDialog dialog={dialog} />
  }

  if (dialog.type === 'error') {
    return <DeprecatedErrorDialog dialog={dialog} />
  }

  const unknownDialog: any = dialog

  // eslint-disable-next-line no-console
  console.warn(`Unsupported dialog type ${unknownDialog.type}`)

  return (
    <Dialog
      id={dialogId}
      onClose={unknownDialog.onClose}
      onClickOutside={unknownDialog.onClose}
      width={2}
    >
      <Box padding={4}>
        {unknownDialog.content || (
          <>
            Unexpected dialog type (<code>{unknownDialog.type}</code>)
          </>
        )}
      </Box>
    </Dialog>
  )
}
