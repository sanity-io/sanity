import React from 'react'
import {Box, Dialog, Layer} from '@sanity/ui'
import {PopoverDialog} from '../../components/popoverDialog'
import {PresenceOverlay} from '../../presence'

const PRESENCE_MARGINS: [number, number, number, number] = [0, 0, 1, 0]

interface Props {
  type: 'fullscreen' | 'popover' | 'dialog' | 'inline'
  header: string
  id?: string
  onClose: () => void
  children?: JSX.Element
  // eslint-disable-next-line camelcase
  legacy_referenceElement: HTMLElement | null
}

export function EditPortal(props: Props): React.ReactElement {
  const {type, id, onClose, children, legacy_referenceElement: referenceElement, header} = props

  if (type === 'inline') {
    return <>{children}</>
  }
  if (type === 'fullscreen') {
    return (
      <Layer>
        <Dialog
          width="auto"
          id={id || ''}
          onClose={onClose}
          header={header}
          __unstable_autoFocus={false}
        >
          <PresenceOverlay margins={PRESENCE_MARGINS}>
            <Box padding={4}>{children}</Box>
          </PresenceOverlay>
        </Dialog>
      </Layer>
    )
  }

  // @ts-expect-error fold is deprecated and should not be visible though types
  if (type === 'popover' || type === 'fold') {
    // @ts-expect-error fold is deprecated and should not be visible though types
    if (type === 'fold') {
      console.warn(`The option named \`editItem: "fold"\` is no longer supported`)
    }

    return (
      <PopoverDialog
        onClose={onClose}
        referenceElement={referenceElement}
        placement="auto"
        title={header}
      >
        <PresenceOverlay margins={PRESENCE_MARGINS}>
          <Box padding={4}>{children}</Box>
        </PresenceOverlay>
      </PopoverDialog>
    )
  }

  return (
    <Dialog width={1} id={id || ''} onClose={onClose} header={header} __unstable_autoFocus={false}>
      <PresenceOverlay margins={PRESENCE_MARGINS}>
        <Box padding={4}>{children}</Box>
      </PresenceOverlay>
    </Dialog>
  )
}
