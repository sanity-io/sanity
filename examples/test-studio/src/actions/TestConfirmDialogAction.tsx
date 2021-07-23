import {DocumentActionComponent} from '@sanity/base'
import {Button, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'

export const TestConfirmDialogAction: DocumentActionComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleOpen = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
  }, [])

  const handleCancel = useCallback(() => {
    setDialogOpen(false)
  }, [])

  const handleConfirm = useCallback(() => {
    setDialogOpen(false)
  }, [])

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
