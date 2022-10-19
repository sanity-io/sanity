import React, {ReactNode} from 'react'
import {Box, Dialog, Layer, ResponsiveWidthProps} from '@sanity/ui'
import {PresenceOverlay} from '../../presence'
import {PopoverDialog} from '../../components'

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
}

export function EditPortal(props: Props): React.ReactElement {
  const {
    type,
    id,
    width,
    onClose,
    children,
    legacy_referenceElement: referenceElement,
    header,
  } = props
  const contents = (
    <PresenceOverlay margins={PRESENCE_MARGINS}>
      <Box padding={4}>{children}</Box>
    </PresenceOverlay>
  )
  return type === 'dialog' ? (
    <Layer>
      <Dialog width={width} id={id || ''} onClose={onClose} header={header}>
        {contents}
      </Dialog>
    </Layer>
  ) : (
    <PopoverDialog
      width={width}
      onClose={onClose}
      referenceElement={referenceElement}
      header={header}
    >
      {contents}
    </PopoverDialog>
  )
}
