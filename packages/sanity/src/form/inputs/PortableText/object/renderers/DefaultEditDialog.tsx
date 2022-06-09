import React from 'react'
import {useId} from '@reach/auto-id'
import {Box, Dialog, PortalProvider, usePortal} from '@sanity/ui'
import {PresenceOverlay} from '../../../../../presence'
import {DIALOG_WIDTH_TO_UI_WIDTH} from './constants'
import {ModalWidth} from './types'

interface DefaultEditDialogProps {
  title: string | React.ReactNode
  onClose: () => void
  children: React.ReactNode
  width?: ModalWidth
}

export function DefaultEditDialog(props: DefaultEditDialogProps) {
  const {onClose, children, title, width = 'medium'} = props

  const dialogId = useId()
  const portal = usePortal()

  return (
    <Dialog
      __unstable_autoFocus
      id={dialogId || ''}
      onClose={onClose}
      onClickOutside={onClose}
      header={title}
      portal="default"
      width={DIALOG_WIDTH_TO_UI_WIDTH[width]}
    >
      <PresenceOverlay margins={[0, 0, 1, 0]}>
        <Box padding={4}>
          <PortalProvider element={portal.elements?.default}>{children}</PortalProvider>
        </Box>
      </PresenceOverlay>
    </Dialog>
  )
}
