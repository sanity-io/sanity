import {DocumentActionComponent} from '@sanity/base'
import {Button, Grid, Text, useToast} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'

export const TestModalDialogAction: DocumentActionComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = useCallback(() => {
    setDialogOpen(true)
    pushToast({title: '[Modal] Opened'})
  }, [pushToast])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    pushToast({title: '[Modal] Opened'})
  }, [pushToast])

  return useMemo(
    () => ({
      dialog: dialogOpen && {
        type: 'modal',
        content: (
          <Text>
            This is the <code>modal</code> dialog
          </Text>
        ),
        footer: (
          <Grid columns={1} gap={2}>
            <Button onClick={handleClose} text="Close" />
          </Grid>
        ),
        header: 'Test modal dialog',
        onClose: handleClose,
        showCloseButton: false,
        width: 'medium',
      },
      onHandle: handleOpen,
      label: 'Test modal dialog',
    }),
    [dialogOpen, handleClose, handleOpen]
  )
}
