import React, {useId} from 'react'
import {Box, Dialog} from '@sanity/ui'
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

  return (
    <Dialog
      // __unstable_autoFocus={false}
      header={title}
      id={dialogId}
      onClickOutside={onClose}
      onClose={onClose}
      portal="default"
      width={width}
    >
      <Box padding={4}>{children}</Box>
    </Dialog>
  )
}
