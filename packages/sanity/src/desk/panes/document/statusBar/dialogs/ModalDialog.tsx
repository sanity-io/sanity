import {Box, Dialog} from '@sanity/ui'
import React, {useId} from 'react'
import {DIALOG_WIDTH_TO_UI_WIDTH} from './constants'
import {DocumentActionModalDialogProps, LegacyLayerProvider} from 'sanity'

export function ModalDialog(props: {dialog: DocumentActionModalDialogProps}) {
  const {dialog} = props
  const dialogId = useId()

  const footer = dialog.footer && (
    <Box paddingX={4} paddingY={3}>
      {dialog.footer}
    </Box>
  )

  return (
    <LegacyLayerProvider zOffset="fullscreen">
      <Dialog
        __unstable_hideCloseButton={dialog.showCloseButton === false}
        footer={footer}
        header={dialog.header}
        id={dialogId}
        // eslint-disable-next-line react/jsx-handler-names
        onClose={dialog.onClose}
        // eslint-disable-next-line react/jsx-handler-names
        onClickOutside={dialog.onClose}
        width={dialog.width === undefined ? 1 : DIALOG_WIDTH_TO_UI_WIDTH[dialog.width]}
        // Custom portal element configured in `DocumentPane` so that the dialog is scoped to the current pane
        portal="documentPanelPortalElement"
      >
        <Box padding={4}>{dialog.content}</Box>
      </Dialog>
    </LegacyLayerProvider>
  )
}
