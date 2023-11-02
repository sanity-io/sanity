import {Card, Dialog, Stack, Text} from '@sanity/ui'
import {DocumentActionComponent} from 'sanity'
import React, {useCallback, useState} from 'react'
import {Button} from '../../../../packages/sanity/src/ui'

export const TestCustomComponentAction: DocumentActionComponent = () => {
  const [open, setOpen] = useState<boolean>(false)
  const toggleOpen = useCallback(() => setOpen((v) => !v), [])

  return {
    label: 'Custom modal',
    tone: 'primary',
    onHandle: toggleOpen,
    dialog: {
      type: 'custom',
      component: open && (
        <Dialog
          header="Custom action component"
          id="custom-modal"
          onClickOutside={toggleOpen}
          onClose={toggleOpen}
          width={1}
          footer={
            <Stack padding={2}>
              <Button onClick={toggleOpen} text="Close" />
            </Stack>
          }
        >
          <Card padding={5}>
            <Text>This dialog is rendered using a custom dialog component.</Text>
          </Card>
        </Dialog>
      ),
    },
  }
}
