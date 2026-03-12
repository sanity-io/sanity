import {Button, Dialog, Stack} from '@sanity/ui'
import {useId, useState} from 'react'
import {type ObjectInputProps} from 'sanity'

export function DialogWrappedObjectInput(props: ObjectInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dialogId = useId()

  return (
    <Stack space={3}>
      <Button text="Edit in dialog" mode="ghost" onClick={() => setIsOpen(true)} />
      {isOpen && (
        <Dialog
          open={isOpen}
          id={dialogId}
          header="Object debug: Dialog-wrapped renderDefault"
          onClose={() => setIsOpen(false)}
          width={2}
        >
          {props.renderDefault(props)}
        </Dialog>
      )}
    </Stack>
  )
}
