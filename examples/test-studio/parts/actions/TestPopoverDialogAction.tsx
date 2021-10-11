import {DocumentActionComponent} from '@sanity/base'
import {LaunchIcon} from '@sanity/icons'
import {Button, Stack, Text, useToast} from '@sanity/ui'
import React, {useCallback, useState} from 'react'

export const TestPopoverDialogAction: DocumentActionComponent = (props) => {
  const {onComplete} = props
  const [dialogOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = useCallback(() => {
    setDialogOpen(true)
    pushToast({closable: true, title: '[Popover] Opened'})
  }, [pushToast])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[Popover] Closed'})
    onComplete()
  }, [onComplete, pushToast])

  return {
    dialog: dialogOpen && {
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
    },
    icon: LaunchIcon,
    label: 'Test popover dialog',
    onHandle: handleOpen,
  }
}
