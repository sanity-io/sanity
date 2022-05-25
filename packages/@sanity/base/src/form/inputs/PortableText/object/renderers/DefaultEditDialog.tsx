import React, {useCallback, useEffect} from 'react'
import {useId} from '@reach/auto-id'
import {Box, Dialog, PortalProvider, useLayer, usePortal} from '@sanity/ui'
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
  const {isTopLayer} = useLayer()
  const portal = usePortal()

  const handleClose = useCallback(() => {
    if (isTopLayer) onClose()
  }, [isTopLayer, onClose])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    },
    [handleClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <Dialog
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
