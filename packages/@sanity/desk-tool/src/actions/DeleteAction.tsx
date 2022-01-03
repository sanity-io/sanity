import {DocumentActionComponent, useClient, useDatastores, useSource} from '@sanity/base'
import {TrashIcon} from '@sanity/icons'
import {
  useDocumentOperation,
  unstable_useDocumentPairPermissions as useDocumentPairPermissions,
  useCurrentUser,
} from '@sanity/base/hooks'
import React, {useCallback, useState} from 'react'
import {InsufficientPermissionsMessage} from '@sanity/base/components'
import {ConfirmDeleteDialog} from '../components/confirmDeleteDialog'

const DISABLED_REASON_TITLE = {
  NOTHING_TO_DELETE: 'This document doesn’t yet exist or is already deleted',
}

export const DeleteAction: DocumentActionComponent = ({id, type, draft, onComplete}) => {
  const client = useClient()
  const {schema} = useSource()
  const {grantsStore} = useDatastores()
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
    onComplete()
  }, [onComplete])

  const handleConfirm = useCallback(() => {
    setIsDeleting(true)
    setConfirmDialogOpen(false)
    deleteOp.execute()
    onComplete()
  }, [deleteOp, onComplete])

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions(
    client,
    schema,
    grantsStore,
    {
      id,
      type,
      permission: 'delete',
    }
  )

  const {value: currentUser} = useCurrentUser()

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      tone: 'critical',
      icon: TrashIcon,
      disabled: true,
      label: 'Delete',
      title: (
        <InsufficientPermissionsMessage
          operationLabel="delete this document"
          currentUser={currentUser}
        />
      ),
    }
  }

  return {
    tone: 'critical',
    icon: TrashIcon,
    disabled: isDeleting || Boolean(deleteOp.disabled) || isPermissionsLoading,
    title:
      (deleteOp.disabled &&
        DISABLED_REASON_TITLE[deleteOp.disabled as keyof typeof DISABLED_REASON_TITLE]) ||
      '',
    label: isDeleting ? 'Deleting…' : 'Delete',
    shortcut: 'Ctrl+Alt+D',
    onHandle: handle,
    modal: isConfirmDialogOpen && {
      type: 'dialog',
      onClose: onComplete,
      content: (
        <ConfirmDeleteDialog
          action="delete"
          id={draft?._id || id}
          type={type}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      ),
    },
  }
}
