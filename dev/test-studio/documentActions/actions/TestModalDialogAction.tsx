import {DocumentActionComponent, DocumentActionDescription} from 'sanity'
import {CopyIcon} from '@sanity/icons'
import {Grid, Text, useToast} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {Button} from '../../../../packages/sanity/src/ui'

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
    pushToast({closable: true, title: '[Modal] Closed'})
    onComplete()
  }, [onComplete, pushToast])

  const dialog: DocumentActionDescription['dialog'] = useMemo(
    () =>
      dialogOpen && {
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
    [dialogOpen, handleClose],
  )

  return {
    dialog,
    icon: CopyIcon,
    label: 'Test dialog modal',
    onHandle: handleOpen,
  }
}
