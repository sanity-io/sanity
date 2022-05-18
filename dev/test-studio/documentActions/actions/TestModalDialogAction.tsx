import {DocumentActionComponent, DocumentActionDescription} from '@sanity/base'
import {CopyIcon} from '@sanity/icons'
import {Button, Grid, Text, useToast} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'

export const TestModalDialogAction: DocumentActionComponent = (props) => {
  const {onComplete} = props
  const [modalOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = useCallback(() => {
    setDialogOpen(true)
    pushToast({closable: true, title: '[Modal] Opened'})
  }, [pushToast])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[Modal] Closed'})
    onComplete()
  }, [onComplete, pushToast])

  const modal: DocumentActionDescription['modal'] = useMemo(
    () =>
      modalOpen && {
        type: 'dialog',
        content: (
          <Text>
            This is the <code>dialog</code> modal
          </Text>
        ),
        footer: (
          <Grid columns={1} gap={2}>
            <Button onClick={handleClose} text="Close" />
          </Grid>
        ),
        header: 'Test dialog modal',
        onClose: handleClose,
        showCloseButton: false,
        width: 'medium',
      },
    [modalOpen, handleClose]
  )

  return {
    modal,
    icon: CopyIcon,
    label: 'Test dialog modal',
    onHandle: handleOpen,
  }
}
