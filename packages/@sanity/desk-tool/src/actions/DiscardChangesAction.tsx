import {DocumentActionComponent, DocumentActionDialogProps} from '@sanity/base'
import {useDocumentOperation} from '@sanity/react-hooks'
import {ResetIcon} from '@sanity/icons'
import React, {useCallback, useMemo, useState} from 'react'
import {
  unstable_useCheckDocumentPermission as useCheckDocumentPermission,
  useCurrentUser,
} from '@sanity/base/hooks'
import {InsufficientPermissionsMessage} from '@sanity/base/components'

const DISABLED_REASON_TITLE = {
  NO_CHANGES: 'This document has no unpublished changes',
  NOT_PUBLISHED: 'This document is not published',
}

export const DiscardChangesAction: DocumentActionComponent = ({
  id,
  type,
  published,
  liveEdit,
  onComplete,
}) => {
  const {discardChanges}: any = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const deleteDraftPermission = useCheckDocumentPermission(id, type, 'discardDraft')
  const {value: currentUser} = useCurrentUser()

  const handleConfirm = useCallback(() => {
    discardChanges.execute()
    onComplete()
  }, [discardChanges, onComplete])

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  const dialog: DocumentActionDialogProps | false = useMemo(
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

  if (!deleteDraftPermission.granted) {
    return {
      color: 'danger',
      icon: ResetIcon,
      disabled: true,
      label: 'Discard changes',
      title: (
        <InsufficientPermissionsMessage
          operationLabel="discard changes in this document"
          currentUser={currentUser}
        />
      ),
    }
  }

  return {
    color: 'danger',
    icon: ResetIcon,
    disabled: Boolean(discardChanges.disabled),
    title:
      (discardChanges.disabled &&
        DISABLED_REASON_TITLE[discardChanges.disabled as keyof typeof DISABLED_REASON_TITLE]) ||
      '',
    label: 'Discard changes',
    onHandle: handle,
    dialog,
  }
}
