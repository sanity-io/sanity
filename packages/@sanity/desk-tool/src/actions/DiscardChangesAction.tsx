import React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import CloseIcon from 'part:@sanity/base/close-icon'
import {createAction} from 'part:@sanity/base/actions/utils'

export const DiscardChangesAction = createAction(function DiscardChangesAction({
  id,
  type,
  published,
  onComplete
}) {
  if (!published) {
    return null
  }

  const {discardDraft}: any = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  return {
    icon: CloseIcon,
    disabled: Boolean(discardDraft.disabled),
    title: discardDraft.disabled ? discardDraft.disabled : '',
    label: 'Discard changes',
    onHandle: () => {
      setConfirmDialogOpen(true)
    },
    dialog: isConfirmDialogOpen && {
      type: 'confirm',
      color: 'danger',
      onCancel: onComplete,
      onConfirm: () => {
        discardDraft.execute()
        onComplete()
      },
      message: (
        <>
          <strong>Are you sure</strong> you want to discard all changes since last published?
        </>
      )
    }
  }
})
