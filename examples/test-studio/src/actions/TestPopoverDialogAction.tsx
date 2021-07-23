import {DocumentActionComponent} from '@sanity/base'
import {Button, Stack, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'

export const TestPopoverDialogAction: DocumentActionComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleOpen = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
  }, [])

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
