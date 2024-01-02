/* eslint-disable import/no-extraneous-dependencies */

import {ResetIcon} from '@sanity/icons'
import React, {useCallback, useMemo, useState} from 'react'
import {structureLocaleNamespace} from '../i18n'
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
  NO_CHANGES: 'action.discard-changes.disabled.no-changes',
  NOT_PUBLISHED: 'action.discard-changes.disabled.not-published',
  NOT_READY: 'action.discard-changes.disabled.not-ready',
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

  const {t} = useTranslation(structureLocaleNamespace)

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
        message: t('action.discard-changes.confirm-dialog.confirm-discard-changes'),
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
      label: t('action.discard-changes.label'),
      title: <InsufficientPermissionsMessage context="discard-changes" currentUser={currentUser} />,
    }
  }

  return {
    tone: 'critical',
    icon: ResetIcon,
    disabled: Boolean(discardChanges.disabled) || isPermissionsLoading,
    title: (discardChanges.disabled && DISABLED_REASON_KEY[discardChanges.disabled]) || '',
    label: t('action.discard-changes.label'),
    onHandle: handle,
    dialog,
  }
}

DiscardChangesAction.action = 'discardChanges'
