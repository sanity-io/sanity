import {useId} from '@reach/auto-id'
import {DocumentActionModalDialogProps} from '@sanity/base'
import {LegacyLayerProvider} from '@sanity/base/components'
import {Box, Dialog, DialogProps} from '@sanity/ui'
import React from 'react'

const DIALOG_WIDTH_TO_UI_WIDTH: {[key: string]: DialogProps['width']} = {
  small: 0,
  medium: 1,
  large: 2,
  full: 'auto',
}

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
        onClose={dialog.onClose}
        onClickOutside={dialog.onClose}
        width={dialog.width === undefined ? 1 : DIALOG_WIDTH_TO_UI_WIDTH[dialog.width]}
      >
        <Box padding={4}>{dialog.content}</Box>
      </Dialog>
    </LegacyLayerProvider>
  )
}
