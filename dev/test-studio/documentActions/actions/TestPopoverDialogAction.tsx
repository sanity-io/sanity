import {LaunchIcon} from '@sanity/icons/Launch'
import {Button, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useState} from 'react'
import {type DocumentActionComponent, type DocumentActionDescription} from 'sanity'
import {Flex} from 'ui5'

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
          <Flex padding={4} gap={4} flexDirection="column">
            <Text>
              This is the <code>popover</code> dialog
            </Text>
            <Button onClick={handleClose} text="Close" />
          </Flex>
        ),
        onClose: handleClose,
      } satisfies DocumentActionDescription['dialog']),
    icon: LaunchIcon,
    label: 'Test popover dialog',
    onHandle: handleOpen,
  } satisfies DocumentActionDescription
}

useTestPopoverDialogAction.displayName = 'TestPopoverDialogAction'
