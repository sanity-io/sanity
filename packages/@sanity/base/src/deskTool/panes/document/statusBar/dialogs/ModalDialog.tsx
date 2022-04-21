import {useId} from '@reach/auto-id'
import {Box, Dialog} from '@sanity/ui'
import React from 'react'
import {LegacyLayerProvider} from '../../../../../components/transitional'
import {DocumentActionDialogModalProps} from '../../../../actions'
import {DIALOG_WIDTH_TO_UI_WIDTH} from './constants'

export function ModalDialog(props: {modal: DocumentActionDialogModalProps}) {
  const {modal} = props
  const modalId = useId() || ''

  const footer = modal.footer && (
    <Box paddingX={4} paddingY={3}>
      {modal.footer}
    </Box>
  )

  return (
    <LegacyLayerProvider zOffset="fullscreen">
      <Dialog
        __unstable_hideCloseButton={modal.showCloseButton === false}
        footer={footer}
        header={modal.header}
        id={modalId}
        // eslint-disable-next-line react/jsx-handler-names
        onClose={modal.onClose}
        // eslint-disable-next-line react/jsx-handler-names
        onClickOutside={modal.onClose}
        width={modal.width === undefined ? 1 : DIALOG_WIDTH_TO_UI_WIDTH[modal.width]}
      >
        <Box padding={4}>{modal.content}</Box>
      </Dialog>
    </LegacyLayerProvider>
  )
}
