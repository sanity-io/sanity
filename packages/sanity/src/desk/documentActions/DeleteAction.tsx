/* eslint-disable import/no-extraneous-dependencies */

import {TrashIcon} from '@sanity/icons'
import React, {useCallback, useState} from 'react'
import {ConfirmDeleteDialog} from '../components'
import {useDocumentPane} from '../panes/document/useDocumentPane'
import {deskLocaleNamespace} from '../i18n'
import {
  DocumentActionComponent,
  InsufficientPermissionsMessage,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useTranslation,
} from 'sanity'

const DISABLED_REASON_TITLE_KEY = {
  NOTHING_TO_DELETE: 'action.delete.disabled.nothing-to-delete',
  NOT_READY: 'action.delete.disabled.not-ready',
}

/** @internal */
export const DeleteAction: DocumentActionComponent = ({id, type, draft, onComplete}) => {
  const {setIsDeleting: paneSetIsDeleting} = useDocumentPane()
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const {t} = useTranslation(deskLocaleNamespace)

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
    onComplete()
  }, [onComplete])

  const handleConfirm = useCallback(() => {
    setIsDeleting(true)
    setConfirmDialogOpen(false)
    paneSetIsDeleting(true)
    deleteOp.execute()
    onComplete()
  }, [deleteOp, onComplete, paneSetIsDeleting])

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
      label: t('action.delete.label'),
      title: (
        <InsufficientPermissionsMessage
          i18nKey="insufficient-permissions-message.action.delete-document"
          currentUser={currentUser}
        />
      ),
    }
  }

  return {
    tone: 'critical',
    icon: TrashIcon,
    disabled: isDeleting || Boolean(deleteOp.disabled) || isPermissionsLoading,
    title: (deleteOp.disabled && t(DISABLED_REASON_TITLE_KEY[deleteOp.disabled])) || '',
    label: isDeleting ? t('action.delete.running.label') : t('action.delete.label'),
    shortcut: 'Ctrl+Alt+D',
    onHandle: handle,
    dialog: isConfirmDialogOpen && {
      type: 'custom',
      component: (
        <ConfirmDeleteDialog
          // eslint-disable-next-line no-attribute-string-literals/no-attribute-string-literals
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
