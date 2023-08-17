import React, {useCallback, useEffect, useId, useRef, useState} from 'react'
import {Box, Dialog} from '@sanity/ui'
import {clearAllBodyScrollLocks, disableBodyScroll} from '../../../../../hooks'
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
  const containerElement = useRef<HTMLDivElement | null>(null)

  //Avoid background of dialog being scrollable on mobile
  //TODO: fix issue where when this dialog is open, the background is cropped
  //(localhost:3333/test/content/input-standard;portable-text;blocksTest;3f244990-7675-4623-b835-039b06af8dd3)
  useEffect(() => {
    if (contentElement) {
      disableBodyScroll(contentElement)
    }
  }, [contentElement])

  const handleOnClose = useCallback(() => {
    onClose()
    clearAllBodyScrollLocks()
  }, [onClose])

  return (
    <Dialog
      header={title}
      id={dialogId}
      onClickOutside={handleOnClose}
      onClose={handleOnClose}
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
          <Box padding={4} ref={containerElement}>
            {children}
          </Box>
        </VirtualizerScrollInstanceProvider>
      </PresenceOverlay>
    </Dialog>
  )
}
