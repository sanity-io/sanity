import {DocumentActionComponent, DocumentActionDescription} from 'sanity'
import {CheckmarkCircleIcon, CloseCircleIcon} from '@sanity/icons'
import {Text, useToast} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {Button} from '../../../../packages/sanity/src/ui'

export const TestConfirmDialogAction: DocumentActionComponent = (props) => {
  const {onComplete} = props
  const [dialogOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = useCallback(() => {
    if (!dialogOpen) {
      setDialogOpen(true)
      pushToast({closable: true, title: '[confirm] Opened'})
    }
  }, [dialogOpen, pushToast])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[confirm] Closed'})
    onComplete()
  }, [onComplete, pushToast])

  const handleCancel = useCallback(() => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[confirm] Cancelled'})
    onComplete()
  }, [onComplete, pushToast])

  const handleConfirm = useCallback(() => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[confirm] Confirmed', status: 'info'})
    onComplete()
  }, [onComplete, pushToast])

  const dialog: DocumentActionDescription['dialog'] = useMemo(
    () =>
      dialogOpen && {
        type: 'confirm',
        tone: 'positive',
        content: (
          <>
            <Text>
              This is the <code>confirm</code> dialog
            </Text>
            <Button onClick={handleClose} text="Close" />
          </>
        ),
        message: 'Test confirm dialog',
        onCancel: handleCancel,
        onConfirm: handleConfirm,
        cancelButtonIcon: CloseCircleIcon,
        cancelButtonText: 'No',
        confirmButtonIcon: CheckmarkCircleIcon,
        confirmButtonText: 'Yes',
      },
    [dialogOpen, handleCancel, handleClose, handleConfirm],
  )

  return {
    tone: 'positive',
    dialog,
    onHandle: handleOpen,
    label: 'Test confirm dialog',
    shortcut: 'mod+p',
  }
}
