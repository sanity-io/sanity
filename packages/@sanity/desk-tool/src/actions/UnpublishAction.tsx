import {DocumentActionComponent, DocumentActionDialogProps} from '@sanity/base'
import {useDocumentOperation} from '@sanity/react-hooks'
import {UnpublishIcon} from '@sanity/icons'
import React, {useCallback, useState} from 'react'
import {
  unstable_useDocumentPairPermissions as useDocumentPairPermissions,
  useCurrentUser,
} from '@sanity/base/hooks'
import {InsufficientPermissionsMessage} from '@sanity/base/components'
import {ConfirmDeleteDialog} from '../components/confirmDeleteDialog'

const DISABLED_REASON_TITLE = {
  NOT_PUBLISHED: 'This document is not published',
}

export const UnpublishAction: DocumentActionComponent = ({
  id,
  type,
  draft,
  onComplete,
  liveEdit,
}) => {
  const {unpublish}: any = useDocumentOperation(id, type)
  const [error, setError] = useState<Error | null>(null)
  const [didUnpublish, setDidUnpublish] = useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'unpublish',
  })
  const {value: currentUser} = useCurrentUser()

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
    onComplete()
  }, [onComplete])

  const handleConfirm = useCallback(() => {
    setConfirmDialogOpen(false)
    unpublish.execute()
    onComplete()
  }, [onComplete, unpublish])

  const dialog = ((): DocumentActionDialogProps | null => {
    if (error) {
      return {
        type: 'error',
        onClose: () => setError(null),
        title: 'An error occurred',
        content: error.message,
      }
    }

    if (didUnpublish) {
      return {
        type: 'success',
        onClose: () => {
          setDidUnpublish(false)
        },
        title: 'Successfully unpublished the document',
      }
    }

    if (isConfirmDialogOpen) {
      return {
        type: 'legacy',
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
  })()

  if (liveEdit) {
    return null
  }

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      color: 'danger',
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
    color: 'danger',
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
