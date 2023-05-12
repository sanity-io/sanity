import React, {useId, useRef, useState} from 'react'
import {BoundaryElementProvider, Box, Dialog} from '@sanity/ui'
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
  const dialogId = useId()
  // This seems to work with regular refs as well, but it might be safer to use state.
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null)

  return (
    <BoundaryElementProvider element={contentElement}>
      <Dialog
        header={title}
        id={dialogId}
        onClickOutside={onClose}
        onClose={onClose}
        portal="default"
        width={width}
        contentRef={setContentElement}
      >
        <PresenceOverlay margins={[0, 0, 1, 0]}>
          <Box padding={4}>{children}</Box>
        </PresenceOverlay>
      </Dialog>
    </BoundaryElementProvider>
  )
}
