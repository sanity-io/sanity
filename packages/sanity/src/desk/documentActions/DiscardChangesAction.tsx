/* eslint-disable import/no-extraneous-dependencies */

import {ResetIcon} from '@sanity/icons'
import React, {useCallback, useMemo, useState} from 'react'
import {deskLocaleNamespace} from '../i18n'
import {
  DocumentActionComponent,
  DocumentActionDialogProps,
  InsufficientPermissionsMessage,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useTranslation,
} from 'sanity'

const DISABLED_REASON_KEY = {
  NO_CHANGES: 'action.discardChanges.disabled.noChanges',
  NOT_PUBLISHED: 'action.discardChanges.disabled.notPublished',
  NOT_READY: 'action.discardChanges.disabled.notReady',
} as const

/** @internal */
export const DiscardChangesAction: DocumentActionComponent = ({
  id,
  type,
  published,
  liveEdit,
  onComplete,
}) => {
  const {discardChanges} = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'discardDraft',
  })
  const currentUser = useCurrentUser()

  const {t} = useTranslation(deskLocaleNamespace)

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
        tone: 'critical',
        onCancel: onComplete,
        onConfirm: handleConfirm,
        message: t('action.discardChanges.confirmDialog.confirmDiscardChanges'),
      },
    [handleConfirm, isConfirmDialogOpen, onComplete, t],
  )

  if (!published || liveEdit) {
    return null
  }

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      tone: 'critical',
      icon: ResetIcon,
      disabled: true,
      label: t('action.discardChanges.label'),
      title: (
        <InsufficientPermissionsMessage
          operationLabel="discard changes in this document"
          currentUser={currentUser}
        />
      ),
    }
  }

  return {
    tone: 'critical',
    icon: ResetIcon,
    disabled: Boolean(discardChanges.disabled) || isPermissionsLoading,
    title: (discardChanges.disabled && DISABLED_REASON_KEY[discardChanges.disabled]) || '',
    label: t('action.discardChanges.label'),
    onHandle: handle,
    dialog,
  }
}

DiscardChangesAction.action = 'discardChanges'
