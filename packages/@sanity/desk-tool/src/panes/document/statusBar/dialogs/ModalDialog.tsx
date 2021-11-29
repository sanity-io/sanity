import {useId} from '@reach/auto-id'
import type {DocumentActionModalDialogProps} from '@sanity/base'
import {LegacyLayerProvider} from '@sanity/base/components'
import {Box, Dialog} from '@sanity/ui'
import React from 'react'
import {DIALOG_WIDTH_TO_UI_WIDTH} from './constants'

export function ModalDialog(props: {dialog: DocumentActionModalDialogProps}) {
  const {dialog} = props
  const dialogId = useId() || ''

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
      >
        <Box padding={4}>{dialog.content}</Box>
      </Dialog>
    </LegacyLayerProvider>
  )
}
