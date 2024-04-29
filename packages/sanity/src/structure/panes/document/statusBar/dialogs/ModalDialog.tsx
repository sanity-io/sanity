import {
  Box,
  Dialog, // eslint-disable-line no-restricted-imports
} from '@sanity/ui'
import {useId} from 'react'
import {type DocumentActionModalDialogProps, LegacyLayerProvider} from 'sanity'

import {DIALOG_WIDTH_TO_UI_WIDTH} from './constants'

/**
 * Dialog rendered by custom document actions of dialog type `dialog`.
 * As these are user configurable with public facing APIs, internal studio ui-components are not used.
 */
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
        animate
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
