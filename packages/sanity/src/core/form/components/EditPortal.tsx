import {Box, type ResponsiveWidthProps} from '@sanity/ui'
import {type DragEvent, type ReactElement, type ReactNode, useRef, useState} from 'react'

import {Dialog} from '../../../ui-components'
import {PopoverDialog} from '../../components'
import {PresenceOverlay} from '../../presence'
import {VirtualizerScrollInstanceProvider} from '../inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'

const PRESENCE_MARGINS: [number, number, number, number] = [0, 0, 1, 0]

interface Props {
  type: 'popover' | 'dialog'
  width: ResponsiveWidthProps['width']
  header: string
  id?: string
  onClose: () => void
  children?: ReactNode
  // eslint-disable-next-line camelcase
  legacy_referenceElement: HTMLElement | null
  autofocus?: boolean
}

function onDragEnter(event: DragEvent<HTMLDivElement>) {
  return event.stopPropagation()
}

function onDrop(event: DragEvent<HTMLDivElement>) {
  return event.stopPropagation()
}

export function EditPortal(props: Props): ReactElement {
  const {
    children,
    header,
    id,
    legacy_referenceElement: referenceElement,
    onClose,
    type,
    width,
    autofocus,
  } = props
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
          header={header}
          id={id || ''}
          onClickOutside={onClose}
          onClose={onClose}
          onDragEnter={onDragEnter}
          onDrop={onDrop}
          width={width}
          contentRef={setDocumentScrollElement}
          __unstable_autoFocus={autofocus}
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
      referenceElement={referenceElement}
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
