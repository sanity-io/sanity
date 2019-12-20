import * as React from 'react'
import Dialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'

import styles from './DocumentStatusBar.css'

// Todo: move these to action spec/core types
interface ConfirmDialogProps {
  type: 'confirm'
  color: string
  message: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}

// Todo: move these to action spec/core types
interface ModalDialogProps {
  type: 'modal'
  content: React.ReactNode
  onClose: () => void
}

// Todo: move these to action spec/core types
interface PopOverDialogProps {
  type: 'popover'
  content: React.ReactNode
  onClose: () => void
}

interface LegacyDialogProps {
  type: 'legacy'
  content: React.ReactNode
  onClose: () => void
}

interface Props {
  dialog: ConfirmDialogProps | LegacyDialogProps | ModalDialogProps | PopOverDialogProps
}

export function ActionStateDialog(props: Props) {
  const {dialog} = props

  if (dialog.type === 'legacy') {
    return <>{dialog.content}</>
  }

  if (dialog.type === 'confirm') {
    return (
      <PopOverDialog
        onClickOutside={dialog.onCancel}
        placement="auto-end"
        useOverlay={false}
        hasAnimation
      >
        <>
          <div className={styles.popOverText}>{dialog.message}</div>
          <ButtonGrid>
            <Button onClick={dialog.onCancel} kind="simple">
              Cancel
            </Button>
            <Button onClick={dialog.onConfirm} color={dialog.color || 'danger'}>
              Confirm
            </Button>
          </ButtonGrid>
        </>
      </PopOverDialog>
    )
  }

  if (dialog.type === 'modal') {
    return (
      <Dialog onClose={dialog.onClose} onClickOutside={dialog.onClose}>
        <DialogContent size="medium" padding="large">
          {dialog.content}
        </DialogContent>
      </Dialog>
    )
  }

  if (dialog.type === 'popover') {
    return (
      <PopOverDialog
        onClickOutside={dialog.onClose}
        placement="auto-end"
        useOverlay={false}
        hasAnimation
      >
        {dialog.content}
      </PopOverDialog>
    )
  }

  const unknownDialog: any = dialog
  console.warn(`Unsupported dialog type ${unknownDialog.type}`)
  return (
    <Dialog onClose={unknownDialog.onClose} onClickOutside={unknownDialog.onClose}>
      <DialogContent size="medium" padding="large">
        {unknownDialog.content || `Don't know how to render dialog of type ${unknownDialog.type}`}
      </DialogContent>
    </Dialog>
  )
}
