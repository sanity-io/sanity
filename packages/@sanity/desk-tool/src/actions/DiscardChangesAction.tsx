import {useDocumentOperation} from '@sanity/react-hooks'
import ResetIcon from 'part:@sanity/base/reset-icon'
import React, {useCallback, useMemo} from 'react'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import {
  unstable_useCheckDocumentPermission as useCheckDocumentPermission,
  useCurrentUser,
} from '@sanity/base/hooks'
import {InsufficientPermissionsMessage} from '@sanity/base/components'

const DISABLED_REASON_TITLE = {
  NO_CHANGES: 'This document has no unpublished changes',
  NOT_PUBLISHED: 'This document is not published',
}

export function DiscardChangesAction({id, type, published, liveEdit, onComplete}) {
  const {discardChanges}: any = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  const deleteDraftPermission = useCheckDocumentPermission(id, type, 'delete')

  const {value: currentUser} = useCurrentUser()

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
        color: 'warning',
        onCancel: onComplete,
        onConfirm: handleConfirm,
        message: <>Are you sure you want to discard all changes since last published?</>,
      },
    [handleConfirm, isConfirmDialogOpen, onComplete]
  )

  if (!published || liveEdit) {
    return null
  }

  if (!deleteDraftPermission.granted) {
    return {
      color: 'warning',
      icon: ContentCopyIcon,
      disabled: true,
      label: 'Duplicate',
      title: (
        <InsufficientPermissionsMessage
          operationLabel="discard changes in this document"
          currentUser={currentUser}
        />
      ),
    }
  }

  return {
    color: 'warning',
    icon: ResetIcon,
    disabled: Boolean(discardChanges.disabled),
    title: (discardChanges.disabled && DISABLED_REASON_TITLE[discardChanges.disabled]) || '',
    label: 'Discard changes',
    onHandle: handle,
    dialog,
  }
}
