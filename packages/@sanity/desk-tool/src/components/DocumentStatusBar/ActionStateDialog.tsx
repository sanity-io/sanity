import * as React from 'react'
import Dialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'

interface Props {
  dialog: {
    type: 'fullscreen' | 'modal' | 'legacy'
    content: React.ReactNode
    onClose: () => void
  }
}

export function ActionStateDialog(props: Props) {
  const {type, content, onClose} = props.dialog

  if (type === 'legacy') {
    return <>{content}</>
  }

  return (
    <Dialog onClose={onClose} onClickOutside={onClose}>
      <DialogContent size="medium" padding="large">
        {content}
      </DialogContent>
    </Dialog>
  )
}
