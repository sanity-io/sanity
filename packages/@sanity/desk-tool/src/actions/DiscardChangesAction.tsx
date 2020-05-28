import React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import ResetIcon from 'part:@sanity/base/reset-icon'

const DISABLED_REASON_TITLE = {
  NO_CHANGES: 'This document has no unpublished changes',
  NOT_PUBLISHED: 'This document is not published'
}

export function DiscardChangesAction({id, type, published, liveEdit, onComplete}) {
  const {discardChanges}: any = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  if (!published || liveEdit) {
    return null
  }

  return {
    icon: ResetIcon,
    disabled: Boolean(discardChanges.disabled),
    title: (discardChanges.disabled && DISABLED_REASON_TITLE[discardChanges.disabled]) || '',
    label: 'Discard changes',
    onHandle: () => {
      setConfirmDialogOpen(true)
    },
    dialog: isConfirmDialogOpen && {
      type: 'confirm',
      color: 'danger',
      onCancel: onComplete,
      onConfirm: () => {
        discardChanges.execute()
        onComplete()
      },
      message: (
        <>
          <strong>Are you sure</strong> you want to discard all changes since last published?
        </>
      )
    }
  }
}
