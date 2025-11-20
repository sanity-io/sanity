import {ResetIcon} from '@sanity/icons'
import {useCallback, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDialogProps,
  InsufficientPermissionsMessage,
  isPublishedId,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useTranslation,
} from 'sanity'

import {structureLocaleNamespace} from '../i18n'
import {useDocumentPane} from '../panes/document/useDocumentPane'

const DISABLED_REASON_KEY = {
  NO_CHANGES: 'action.discard-changes.disabled.no-change',
  NOT_PUBLISHED: 'action.discard-changes.disabled.not-published',
  NOT_READY: 'action.discard-changes.disabled.not-ready',
} as const

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const useDiscardChangesAction: DocumentActionComponent = ({
  id,
  type,
  published,
  liveEdit,
  release,
}) => {
  const {discardChanges} = useDocumentOperation(id, type, release)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: release,
    permission: 'discardDraft',
  })
  const currentUser = useCurrentUser()
  const {displayed} = useDocumentPane()

  const {t} = useTranslation(structureLocaleNamespace)
  const isPublished = displayed?._id && isPublishedId(displayed?._id)

  const handleConfirm = useCallback(() => {
    discardChanges.execute()
    setConfirmDialogOpen(false)
  }, [discardChanges])

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
  }, [])

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  const dialog: DocumentActionDialogProps | false = useMemo(
    () =>
      isConfirmDialogOpen && {
        type: 'confirm',
        tone: 'critical',
        onCancel: handleCancel,
        onConfirm: handleConfirm,
        message: t('action.discard-changes.confirm-dialog.confirm-discard-changes'),
      },
    [handleConfirm, isConfirmDialogOpen, handleCancel, t],
  )

  return useMemo(() => {
    if (!published || liveEdit || isPublished) {
      return null
    }

    if (!isPermissionsLoading && !permissions?.granted) {
      return {
        tone: 'critical',
        icon: ResetIcon,
        disabled: true,
        label: t('action.discard-changes.label'),
        title: (
          <InsufficientPermissionsMessage context="discard-changes" currentUser={currentUser} />
        ),
      }
    }

    return {
      tone: 'critical',
      icon: ResetIcon,
      disabled: Boolean(discardChanges.disabled) || isPermissionsLoading,
      title: t((discardChanges.disabled && DISABLED_REASON_KEY[discardChanges.disabled]) || ''),
      label: t('action.discard-changes.label'),
      onHandle: handle,
      dialog,
    }
  }, [
    currentUser,
    dialog,
    discardChanges.disabled,
    handle,
    isPermissionsLoading,
    isPublished,
    liveEdit,
    permissions?.granted,
    published,
    t,
  ])
}

useDiscardChangesAction.action = 'discardChanges'
useDiscardChangesAction.displayName = 'DiscardChangesAction'
