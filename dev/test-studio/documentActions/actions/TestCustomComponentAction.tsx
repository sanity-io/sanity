import {Button, Card, Dialog, Text} from '@sanity/ui'
import {useState} from 'react'
import {type DocumentActionComponent, type DocumentActionDescription} from 'sanity'
import {Flex} from 'ui5'

export const useTestCustomComponentAction: DocumentActionComponent = () => {
  const [open, setOpen] = useState<boolean>(false)
  const toggleOpen = () => setOpen((v) => !v)

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
            <Flex padding={2} flexDirection="column">
              <Button onClick={toggleOpen} text="Close" />
            </Flex>
          }
        >
          <Card padding={5}>
            <Text>This dialog is rendered using a custom dialog component.</Text>
          </Card>
        </Dialog>
      ),
    },
  } satisfies DocumentActionDescription
}

useTestCustomComponentAction.displayName = 'TestCustomComponentAction'
