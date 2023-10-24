import {Box} from '@sanity/ui'
import React, {useId} from 'react'
import {Dialog} from '../../../../../ui/dialog'
import {DIALOG_WIDTH_TO_UI_WIDTH} from './constants'
import {DocumentActionModalDialogProps, LegacyLayerProvider} from 'sanity'

export function ModalDialog(props: {dialog: DocumentActionModalDialogProps}) {
  const {dialog} = props
  const dialogId = useId()

  return (
    <LegacyLayerProvider zOffset="fullscreen">
      <Dialog
        __unstable_hideCloseButton={dialog.showCloseButton === false}
        footer={dialog.footer}
        header={dialog.header}
        id={dialogId}
        // eslint-disable-next-line react/jsx-handler-names
        onClose={dialog.onClose}
        // eslint-disable-next-line react/jsx-handler-names
        onClickOutside={dialog.onClose}
        width={dialog.width === undefined ? 1 : DIALOG_WIDTH_TO_UI_WIDTH[dialog.width]}
      >
        <Box padding={4}>{dialog.content}</Box>
      </Dialog>
    </LegacyLayerProvider>
  )
}
