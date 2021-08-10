import {DocumentActionComponent} from '@sanity/base'
import {BookIcon} from '@sanity/icons'
import {Box, Button, Dialog, Grid, Text, useToast} from '@sanity/ui'
import React, {useCallback, useState} from 'react'

export const TestLegacyDialogAction: DocumentActionComponent = (props) => {
  const {onComplete} = props
  const [dialogOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = useCallback(() => {
    setDialogOpen(true)
    pushToast({closable: true, title: '[Legacy] Opened'})
  }, [pushToast])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[Legacy] Closed'})
    onComplete()
  }, [onComplete, pushToast])

  return {
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
    icon: BookIcon,
    label: 'Test legacy dialog',
    onHandle: handleOpen,
  }
}
