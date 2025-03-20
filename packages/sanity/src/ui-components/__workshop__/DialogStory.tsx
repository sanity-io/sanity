/* eslint-disable react/jsx-no-bind */

import {Box, Card, Container, Stack, Text} from '@sanity/ui'
import {useState} from 'react'

import {Button} from '../button/Button'
import {Dialog} from '../dialog/Dialog'

export default function DialogStory() {
  const [dialogDefaultOpen, setDialogDefaultOpen] = useState(false)
  const [dialogPaddingOpen, setDialogPaddingOpen] = useState(false)

  return (
    <Container width={0} padding={4}>
      <Stack space={4}>
        <Card>
          <Text size={1}>
            <code>Dialog</code> components enforce a limited footer with an opinionated layout
            (consisting of a max of two buttons: a cancel and confirm button).
          </Text>
        </Card>

        <Card border radius={2}>
          <Box marginBottom={3} padding={3}>
            <Text size={2} weight="medium">
              Usage examples
            </Text>
          </Box>
          <Stack padding={3} space={4}>
            <Stack space={3}>
              {dialogDefaultOpen && (
                <Dialog
                  footer={{
                    cancelButton: {text: 'Cancel'},
                    confirmButton: {text: 'Confirm'},
                  }}
                  header="Footer"
                  id="dialog-default"
                  onClose={() => setDialogDefaultOpen(false)}
                >
                  <Text>Footer button styling is non-configurable.</Text>
                </Dialog>
              )}
              <Text muted size={1}>
                Default dialog with footer
              </Text>
              <Box>
                <Button onClick={() => setDialogDefaultOpen(true)} text="Open" />
              </Box>
            </Stack>
            <Stack space={3}>
              {dialogPaddingOpen && (
                <Dialog
                  header="Padding"
                  id="dialog-default"
                  onClose={() => setDialogPaddingOpen(false)}
                  padding={false}
                >
                  <Card padding={4} style={{height: '300px'}} tone="positive">
                    <Text>
                      Disabling padding can be useful when dealing with custom dialog content that
                      requires overflow
                    </Text>
                  </Card>
                </Dialog>
              )}
              <Text muted size={1}>
                Dialog with padding disabled
              </Text>
              <Box>
                <Button onClick={() => setDialogPaddingOpen(true)} text="Open" />
              </Box>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
