import {usePortal, PortalProvider, Text} from '@sanity/ui'
import React, {useId} from 'react'
import {Dialog} from '../../../../ui'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {ConfirmDialog} from './dialogs/ConfirmDialog'
import {ModalDialog} from './dialogs/ModalDialog'
import {PopoverDialog} from './dialogs/PopoverDialog'
import {DocumentActionDialogProps} from 'sanity'

export interface ActionStateDialogProps {
  dialog: DocumentActionDialogProps
  referenceElement?: HTMLElement | null
}

// A portal provider that uses the document panel portal element if it exists
// as the portal element so that dialogs are scoped to the document panel
function DocumentActionPortalProvider(props: {children: React.ReactNode}) {
  const {children} = props
  const {element, elements} = usePortal()
  const portalElement = elements?.[DOCUMENT_PANEL_PORTAL_ELEMENT] || element

  return <PortalProvider element={portalElement}>{children}</PortalProvider>
}

export function ActionStateDialog(props: ActionStateDialogProps) {
  const {dialog, referenceElement = null} = props
  const modalId = useId()

  if (dialog.type === 'confirm') {
    return <ConfirmDialog dialog={dialog} referenceElement={referenceElement} />
  }

  if (dialog.type === 'popover') {
    return <PopoverDialog dialog={dialog} referenceElement={referenceElement} />
  }

  if (dialog.type === 'dialog' || !dialog.type) {
    return (
      <DocumentActionPortalProvider>
        <ModalDialog dialog={dialog} />
      </DocumentActionPortalProvider>
    )
  }

  if (dialog.type === 'custom') {
    return <DocumentActionPortalProvider>{dialog?.component}</DocumentActionPortalProvider>
  }

  // @todo: add validation?
  const unknownModal: any = dialog

  // eslint-disable-next-line no-console
  console.warn(`Unsupported modal type ${unknownModal.type}`)

  return (
    <Dialog
      id={modalId}
      // eslint-disable-next-line react/jsx-handler-names
      onClose={unknownModal.onClose}
      // eslint-disable-next-line react/jsx-handler-names
      onClickOutside={unknownModal.onClose}
      width={1}
    >
      {unknownModal.content || (
        // eslint-disable-next-line i18next/no-literal-string
        <Text size={1}>
          Unexpected modal type (<code>{unknownModal.type}</code>)
        </Text>
      )}
    </Dialog>
  )
}
