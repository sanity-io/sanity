import React, {useId} from 'react'
import {Box, Dialog, PortalProvider, usePortal} from '@sanity/ui'
import {PresenceOverlay} from '../../../../../presence'
import {ModalWidth} from './types'

interface DefaultEditDialogProps {
  title: string | React.ReactNode
  onClose: () => void
  children: React.ReactNode
  width?: ModalWidth
}

export function DefaultEditDialog(props: DefaultEditDialogProps) {
  const {onClose, children, title, width = 1} = props

  const dialogId = useId()
  const portal = usePortal()

  return (
    <Dialog
      __unstable_autoFocus
      id={dialogId || ''}
      onClose={onClose}
      header={title}
      portal="default"
      width={width}
    >
      <PresenceOverlay margins={[0, 0, 1, 0]}>
        <Box padding={4}>
          <PortalProvider element={portal.elements?.default}>{children}</PortalProvider>
        </Box>
      </PresenceOverlay>
    </Dialog>
  )
}
