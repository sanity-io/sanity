import {DocumentActionComponent} from '@sanity/base'
import {Button, Stack, Text, useToast} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'

export const TestPopoverDialogAction: DocumentActionComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = useCallback(() => {
    setDialogOpen(true)
    pushToast({title: '[Popover] Opened'})
  }, [pushToast])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    pushToast({title: '[Popover] Closed'})
  }, [pushToast])

  return useMemo(
    () => ({
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
      onHandle: handleOpen,
      label: 'Test popover dialog',
    }),
    [dialogOpen, handleClose, handleOpen]
  )
}
