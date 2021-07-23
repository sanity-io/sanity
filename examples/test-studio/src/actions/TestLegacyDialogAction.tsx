import {DocumentActionComponent} from '@sanity/base'
import {Box, Button, Dialog, Grid, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'

export const TestLegacyDialogAction: DocumentActionComponent = () => {
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
        type: 'legacy',
        content: (
          <Dialog
            footer={
              <Grid columns={1} paddingX={4} paddingY={3}>
                <Button onClick={handleClose} text="Close" />
              </Grid>
            }
            id="test-legacy-dialog"
          >
            <Box padding={4}>
              <Text>
                This is the <code>legacy</code> dialog
              </Text>
            </Box>
          </Dialog>
        ),
        onClose: handleClose,
      },
      onHandle: handleOpen,
      label: 'Test legacy dialog',
    }),
    [dialogOpen, handleClose, handleOpen]
  )
}
