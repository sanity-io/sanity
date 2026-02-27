import {CopyIcon} from '@sanity/icons'
import {Button, Grid, Text, useToast} from '@sanity/ui'
import {useState} from 'react'
import {type DocumentActionComponent, type DocumentActionDescription} from 'sanity'

export const useTestModalDialogAction: DocumentActionComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = () => {
    setDialogOpen(true)
    pushToast({closable: true, title: '[Modal] Opened'})
  }

  const handleClose = () => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[Modal] Closed'})
  }

  return {
    dialog:
      dialogOpen &&
      ({
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
      } satisfies DocumentActionDescription['dialog']),
    icon: CopyIcon,
    label: 'Test dialog modal',
    onHandle: handleOpen,
  } satisfies DocumentActionDescription
}

useTestModalDialogAction.displayName = 'TestModalDialogAction'
