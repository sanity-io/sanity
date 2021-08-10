import {DocumentActionComponent} from '@sanity/base'
import {CopyIcon} from '@sanity/icons'
import {Button, Grid, Text, useToast} from '@sanity/ui'
import React, {useCallback, useState} from 'react'

export const TestModalDialogAction: DocumentActionComponent = (props) => {
  const {onComplete} = props
  const [dialogOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = useCallback(() => {
    setDialogOpen(true)
    pushToast({closable: true, title: '[Modal] Opened'})
  }, [pushToast])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[Modal] Opened'})
    onComplete()
  }, [onComplete, pushToast])

  return {
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
    icon: CopyIcon,
    label: 'Test modal dialog',
    onHandle: handleOpen,
  }
}
