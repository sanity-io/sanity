import {useDocumentOperation} from '@sanity/react-hooks'
import ResetIcon from 'part:@sanity/base/reset-icon'
import React, {useCallback, useMemo} from 'react'

const DISABLED_REASON_TITLE = {
  NO_CHANGES: 'This document has no unpublished changes',
  NOT_PUBLISHED: 'This document is not published',
}

export function DiscardChangesAction({id, type, published, liveEdit, onComplete}) {
  const {discardChanges}: any = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  const handleConfirm = useCallback(() => {
    discardChanges.execute()
    onComplete()
  }, [discardChanges, onComplete])

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  const dialog = useMemo(
    () =>
      isConfirmDialogOpen && {
        type: 'confirm',
        color: 'danger',
        onCancel: onComplete,
        onConfirm: handleConfirm,
        message: <>Are you sure you want to discard all changes since last published?</>,
      },
    [handleConfirm, isConfirmDialogOpen, onComplete]
  )

  if (!published || liveEdit) {
    return null
  }

  return {
    icon: ResetIcon,
    disabled: Boolean(discardChanges.disabled),
    title: (discardChanges.disabled && DISABLED_REASON_TITLE[discardChanges.disabled]) || '',
    label: 'Discard changes',
    onHandle: handle,
    dialog,
  }
}
