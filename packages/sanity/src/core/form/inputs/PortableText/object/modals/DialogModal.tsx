import React, {useId, useRef, useState} from 'react'
import {Box} from '@sanity/ui'
import {PresenceOverlay} from '../../../../../presence'
import {VirtualizerScrollInstanceProvider} from '../../../arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {Dialog} from '../../../../../../ui'
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
  const containerElement = useRef<HTMLDivElement | null>(null)

  return (
    <Dialog
      header={title}
      id={dialogId}
      onClickOutside={onClose}
      onClose={onClose}
      portal="default"
      width={width}
      contentRef={setContentElement}
      data-testid="default-edit-object-dialog"
      __unstable_autoFocus={autoFocus}
    >
      <PresenceOverlay margins={[0, 0, 1, 0]}>
        <VirtualizerScrollInstanceProvider
          scrollElement={contentElement}
          containerElement={containerElement}
        >
          <Box padding={5} ref={containerElement}>
            {children}
          </Box>
        </VirtualizerScrollInstanceProvider>
      </PresenceOverlay>
    </Dialog>
  )
}
