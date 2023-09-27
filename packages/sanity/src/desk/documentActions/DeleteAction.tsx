/* eslint-disable import/no-extraneous-dependencies */

import {TrashIcon} from '@sanity/icons'
import React, {useCallback, useState} from 'react'
import {useFormState} from 'sanity/document'
import {ConfirmDeleteDialog} from '../components'
import {
  DocumentActionComponent,
  InsufficientPermissionsMessage,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
} from 'sanity'

const DISABLED_REASON_TITLE = {
  NOTHING_TO_DELETE: 'This document doesn’t yet exist or is already deleted',
  NOT_READY: '', // purposefully empty
}

/** @internal */
export const DeleteAction: DocumentActionComponent = ({id, type, draft, onComplete}) => {
  const {delete: deleteFn, isDeleting} = useFormState()
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const deleteDisabledReason = deleteOp.disabled

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
    onComplete()
  }, [onComplete])

  const handleConfirm = useCallback(() => {
    setConfirmDialogOpen(false)
    deleteFn()
    onComplete()
  }, [deleteFn, onComplete])

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'delete',
  })

  const currentUser = useCurrentUser()

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
    disabled: isDeleting || Boolean(deleteDisabledReason) || isPermissionsLoading,
    title: (deleteDisabledReason && DISABLED_REASON_TITLE[deleteDisabledReason]) || '',
    label: isDeleting ? 'Deleting…' : 'Delete',
    shortcut: 'Ctrl+Alt+D',
    onHandle: handle,
    dialog: isConfirmDialogOpen && {
      type: 'custom',
      component: (
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

DeleteAction.action = 'delete'
