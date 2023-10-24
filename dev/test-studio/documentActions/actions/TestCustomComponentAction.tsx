import {Card, Text} from '@sanity/ui'
import {DocumentActionComponent} from 'sanity'
import React, {useCallback, useState} from 'react'
import {Dialog} from '../../../../packages/sanity/src/ui/dialog'

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
          footer={{
            confirmButton: {
              onClick: toggleOpen,
              tone: 'default',
              text: 'Close',
            },
          }}
        >
          <Card padding={5}>
            <Text>This dialog is rendered using a custom dialog component.</Text>
          </Card>
        </Dialog>
      ),
    },
  }
}
