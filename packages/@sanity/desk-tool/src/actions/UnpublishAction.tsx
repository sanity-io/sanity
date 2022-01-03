import {
  DocumentActionComponent,
  DocumentActionModalProps,
  useClient,
  useDatastores,
  useSource,
} from '@sanity/base'
import {
  useDocumentOperation,
  unstable_useDocumentPairPermissions as useDocumentPairPermissions,
  useCurrentUser,
} from '@sanity/base/hooks'
import {UnpublishIcon} from '@sanity/icons'
import React, {useCallback, useMemo, useState} from 'react'
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
  const client = useClient()
  const {schema} = useSource()
  const {grantsStore} = useDatastores()
  const {unpublish} = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions(
    client,
    schema,
    grantsStore,
    {
      id,
      type,
      permission: 'unpublish',
    }
  )
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

  const modal: DocumentActionModalProps | null = useMemo(() => {
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
    modal,
  }
}
