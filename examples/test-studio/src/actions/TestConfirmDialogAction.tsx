import {DocumentActionComponent} from '@sanity/base'
import {Button, Text, useToast} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'

export const TestConfirmDialogAction: DocumentActionComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = useCallback(() => {
    setDialogOpen(true)
    pushToast({title: '[confirm] Opened'})
  }, [pushToast])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    pushToast({title: '[confirm] Closed'})
  }, [pushToast])

  const handleCancel = useCallback(() => {
    setDialogOpen(false)
    pushToast({title: '[confirm] Cancelled'})
  }, [pushToast])

  const handleConfirm = useCallback(() => {
    setDialogOpen(false)
    pushToast({title: '[confirm] Confirmed', status: 'error'})
  }, [pushToast])

  return useMemo(
    () => ({
      dialog: dialogOpen && {
        type: 'confirm',
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
      },
      onHandle: handleOpen,
      label: 'Test confirm dialog',
    }),
    [dialogOpen, handleCancel, handleClose, handleConfirm, handleOpen]
  )
}
