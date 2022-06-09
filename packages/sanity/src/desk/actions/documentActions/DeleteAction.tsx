import {TrashIcon} from '@sanity/icons'
import React, {useCallback, useState} from 'react'
import {InsufficientPermissionsMessage} from '../../../components/InsufficientPermissionsMessage'
import {useCurrentUser, useDocumentPairPermissions} from '../../../datastores'
import {useDocumentOperation} from '../../../hooks'
import {ConfirmDeleteDialog} from '../../components'
import {DocumentActionComponent} from '../types'

const DISABLED_REASON_TITLE = {
  NOTHING_TO_DELETE: 'This document doesn’t yet exist or is already deleted',
}

export const DeleteAction: DocumentActionComponent = ({id, type, draft, onComplete}) => {
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

DeleteAction.action = 'delete'
