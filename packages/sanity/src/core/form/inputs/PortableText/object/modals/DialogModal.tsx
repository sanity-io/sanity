import {BoundaryElementProvider} from '@sanity/ui'
import {type ReactNode, Suspense, useId, useRef, useState} from 'react'
import {Box} from 'ui5'

import {Dialog} from '../../../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../../../components/loadingBlock/LoadingBlock'
import {PresenceOverlay} from '../../../../../presence/overlay/PresenceOverlay'
import {VirtualizerScrollInstanceProvider} from '../../../arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {type ModalWidth} from './types'

interface DefaultEditDialogProps {
  children: ReactNode
  onClose: () => void
  title: string | ReactNode
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
          <BoundaryElementProvider element={contentElement}>
            <Box ref={containerElement}>
              {/* The dialog owns the boundary for the form nodes it shows: a lazy input loads
                  behind its loading block instead of hiding the block that opened it. */}
              <Suspense fallback={<LoadingBlock showText />}>{children}</Suspense>
            </Box>
          </BoundaryElementProvider>
        </VirtualizerScrollInstanceProvider>
      </PresenceOverlay>
    </Dialog>
  )
}
