import React, {useId, useRef} from 'react'
import {Box, Dialog} from '@sanity/ui'
import {PresenceOverlay} from '../../../../../presence'
import {ModalWidth} from './types'

interface DefaultEditDialogProps {
  children: React.ReactNode
  onClose: () => void
  title: string | React.ReactNode
  width?: ModalWidth
}

export function DefaultEditDialog(props: DefaultEditDialogProps) {
  const {onClose, children, title, width = 1} = props
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const dialogId = useId()

  return (
    <Dialog
      header={title}
      id={dialogId}
      onClickOutside={onClose}
      onClose={onClose}
      portal="default"
      width={width}
      ref={dialogRef}
    >
      <PresenceOverlay margins={[0, 0, 1, 0]}>
        <Box padding={4}>{children}</Box>
      </PresenceOverlay>
    </Dialog>
  )
}
