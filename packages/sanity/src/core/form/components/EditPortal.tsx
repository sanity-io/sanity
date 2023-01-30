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
    children,
    header,
    id,
    legacy_referenceElement: referenceElement,
    onClose,
    type,
    width,
  } = props

  const contents = (
    <PresenceOverlay margins={PRESENCE_MARGINS}>
      <Box padding={4}>{children}</Box>
    </PresenceOverlay>
  )

  if (type === 'dialog') {
    return (
      <Layer>
        <Dialog
          header={header}
          id={id || ''}
          onClickOutside={onClose}
          onClose={onClose}
          width={width}
          onActivate={({activeElement}) => activeElement?.focus()}
        >
          {contents}
        </Dialog>
      </Layer>
    )
  }

  return (
    <PopoverDialog
      header={header}
      onClose={onClose}
      referenceElement={referenceElement}
      width={width}
    >
      {contents}
    </PopoverDialog>
  )
}
