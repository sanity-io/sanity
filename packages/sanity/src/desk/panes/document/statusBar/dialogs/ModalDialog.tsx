import React, {useId} from 'react'
import {DIALOG_WIDTH_TO_UI_WIDTH} from './constants'
import {DocumentActionModalDialogProps, LegacyLayerProvider} from 'sanity'
import {Dialog} from 'sanity/_internal-ui-components'

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
        {dialog.content}
      </Dialog>
    </LegacyLayerProvider>
  )
}
