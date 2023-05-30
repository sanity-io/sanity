import React, {useId, useState} from 'react'
import {Box, Dialog} from '@sanity/ui'
import {PresenceOverlay} from '../../../../../presence'
import {VirtualizerScrollInstanceProvider} from '../../../arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {ModalWidth} from './types'

interface DefaultEditDialogProps {
  children: React.ReactNode
  onClose: () => void
  title: string | React.ReactNode
  width?: ModalWidth
  autoFocus?: boolean
}

export function DefaultEditDialog(props: DefaultEditDialogProps) {
  const {onClose, children, title, width = 1, autoFocus} = props
  const dialogId = useId()
  // This seems to work with regular refs as well, but it might be safer to use state.
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null)

  return (
    <Dialog
      header={title}
      id={dialogId}
      onClickOutside={onClose}
      onClose={onClose}
      portal="default"
      width={width}
      contentRef={setContentElement}
      __unstable_autoFocus={autoFocus}
    >
      <PresenceOverlay margins={[0, 0, 1, 0]}>
        <VirtualizerScrollInstanceProvider scrollElement={contentElement}>
          <Box padding={4}>{children}</Box>
        </VirtualizerScrollInstanceProvider>
      </PresenceOverlay>
    </Dialog>
  )
}
