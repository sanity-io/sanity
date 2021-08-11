import {DocumentActionComponent} from '@sanity/base'
import {CheckmarkCircleIcon, CloseCircleIcon} from '@sanity/icons'
import {Button, Text, useToast} from '@sanity/ui'
import React, {useCallback, useState} from 'react'

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

  return {
    color: 'success',
    dialog: dialogOpen && {
      type: 'confirm',
      color: 'success',
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
    onHandle: handleOpen,
    label: 'Test confirm dialog',
    shortcut: 'mod+p',
  }
}
