import {UnpublishIcon} from '@sanity/icons'
import React, {useCallback, useMemo, useState} from 'react'
import {ConfirmDeleteDialog} from '../components'
import {
  DocumentActionComponent,
  InsufficientPermissionsMessage,
  useDocumentPairPermissions,
  useCurrentUser,
  useDocumentOperation,
  DocumentActionModalDialogProps,
} from 'sanity'

const DISABLED_REASON_TITLE = {
  NOT_PUBLISHED: 'This document is not published',
}

/** @internal */
export const UnpublishAction: DocumentActionComponent = ({
  id,
  type,
  draft,
  onComplete,
  liveEdit,
}) => {
  const {unpublish} = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'unpublish',
  })
  const currentUser = useCurrentUser()

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
    onComplete()
  }, [onComplete])

  const handleConfirm = useCallback(() => {
    setConfirmDialogOpen(false)
    unpublish.execute()
    onComplete()
  }, [onComplete, unpublish])

  const dialog: DocumentActionModalDialogProps | null = useMemo(() => {
    if (isConfirmDialogOpen) {
      return {
        type: 'dialog',
        onClose: onComplete,
        content: (
          <ConfirmDeleteDialog
            id={draft?._id || id}
            type={type}
            action="unpublish"
            onCancel={handleCancel}
            onConfirm={handleConfirm}
          />
        ),
      }
    }

    return null
  }, [draft, id, handleCancel, handleConfirm, isConfirmDialogOpen, onComplete, type])

  if (liveEdit) {
    return null
  }

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      tone: 'critical',
      icon: UnpublishIcon,
      label: 'Unpublish',
      title: (
        <InsufficientPermissionsMessage
          operationLabel="unpublish this document"
          currentUser={currentUser}
        />
      ),
      disabled: true,
    }
  }

  return {
    tone: 'critical',
    icon: UnpublishIcon,
    disabled: Boolean(unpublish.disabled) || isPermissionsLoading,
    label: 'Unpublish',
    title: unpublish.disabled
      ? DISABLED_REASON_TITLE[unpublish.disabled as keyof typeof DISABLED_REASON_TITLE]
      : '',
    onHandle: () => setConfirmDialogOpen(true),
    dialog,
  }
}

UnpublishAction.action = 'unpublish'
