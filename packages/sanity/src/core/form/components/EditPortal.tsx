import {Box, type ResponsiveWidthProps} from '@sanity/ui'
import {type DragEvent, type ReactNode, useRef, useState} from 'react'

import {Dialog} from '../../../ui-components'
import {PopoverDialog} from '../../components'
import {PresenceOverlay} from '../../presence'
import {VirtualizerScrollInstanceProvider} from '../inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'

const PRESENCE_MARGINS: [number, number, number, number] = [0, 0, 1, 0]

interface SharedProps {
  children?: ReactNode
  header: string
  width: ResponsiveWidthProps['width']
}
interface DialogProps extends SharedProps {
  type: 'dialog'
  id?: string
  autofocus?: boolean
  onClose?: () => void
}

interface PopoverProps extends SharedProps {
  type: 'popover'
  // eslint-disable-next-line camelcase
  legacy_referenceElement: HTMLElement | null
  onClose: () => void
}

function onDragEnter(event: DragEvent<HTMLDivElement>) {
  return event.stopPropagation()
}

function onDrop(event: DragEvent<HTMLDivElement>) {
  return event.stopPropagation()
}

/**
 * @beta
 * Creates a dialog or a popover for editing content.
 * Handles presence and virtual scrolling.
 */
export function EditPortal(props: PopoverProps | DialogProps): React.JSX.Element {
  const {children, header, onClose, type, width} = props
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)
  const containerElement = useRef<HTMLDivElement | null>(null)

  const contents = (
    <PresenceOverlay margins={PRESENCE_MARGINS}>
      <Box ref={containerElement}>{children}</Box>
    </PresenceOverlay>
  )

  if (type === 'dialog') {
    return (
      <VirtualizerScrollInstanceProvider
        scrollElement={documentScrollElement}
        containerElement={containerElement}
      >
        <Dialog
          __unstable_autoFocus={props.autofocus}
          contentRef={setDocumentScrollElement}
          data-testid="edit-portal-dialog"
          header={header}
          id={props.id || ''}
          onClickOutside={onClose}
          onClose={onClose}
          onDragEnter={onDragEnter}
          onDrop={onDrop}
          width={width}
        >
          {contents}
        </Dialog>
      </VirtualizerScrollInstanceProvider>
    )
  }

  return (
    <PopoverDialog
      header={header}
      onClose={onClose}
      referenceElement={props.legacy_referenceElement}
      width={width}
      containerRef={setDocumentScrollElement}
    >
      <VirtualizerScrollInstanceProvider
        scrollElement={documentScrollElement}
        containerElement={containerElement}
      >
        {contents}
      </VirtualizerScrollInstanceProvider>
    </PopoverDialog>
  )
}
