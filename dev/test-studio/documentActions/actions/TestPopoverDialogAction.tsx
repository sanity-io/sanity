import {LaunchIcon} from '@sanity/icons'
import {Button, Stack, Text, useToast} from '@sanity/ui'
import {useState} from 'react'
import {type DocumentActionComponent, type DocumentActionDescription} from 'sanity'

export const useTestPopoverDialogAction: DocumentActionComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = () => {
    setDialogOpen(true)
    pushToast({closable: true, title: '[Popover] Opened'})
  }

  const handleClose = () => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[Popover] Closed'})
  }

  return {
    dialog:
      dialogOpen &&
      ({
        type: 'popover',
        content: (
          <Stack padding={4} space={4}>
            <Text>
              This is the <code>popover</code> dialog
            </Text>
            <Button onClick={handleClose} text="Close" />
          </Stack>
        ),
        onClose: handleClose,
      } satisfies DocumentActionDescription['dialog']),
    icon: LaunchIcon,
    label: 'Test popover dialog',
    onHandle: handleOpen,
  } satisfies DocumentActionDescription
}

useTestPopoverDialogAction.displayName = 'TestPopoverDialogAction'
