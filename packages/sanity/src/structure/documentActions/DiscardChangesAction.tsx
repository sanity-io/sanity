import {ResetIcon} from '@sanity/icons'
import {useCallback, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  getVersionFromId,
  InsufficientPermissionsMessage,
  isPublishedId,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useTranslation,
} from 'sanity'

import {ConfirmDiscardDialog} from '../components/confirmDiscardDialog/ConfirmDiscardDialog'
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
  version,
  draft,
}) => {
  const bundleId = version?._id && getVersionFromId(version._id)
  const {discardChanges} = useDocumentOperation(id, type, bundleId)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: bundleId,
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

  return useMemo(() => {
    // This document has neither a draft nor a version so there isn't anything to discard
    if (!version && !draft) {
      return null
    }
    // isPublished = we are currently editing the published version and never want to show "Discard drafts" in this case
    if (isPublished) {
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
      dialog: isConfirmDialogOpen && {
        type: 'custom',
        component: (
          <ConfirmDiscardDialog
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            publishedExists={Boolean(published)}
          />
        ),
      },
    }
  }, [
    currentUser,
    handleConfirm,
    handleCancel,
    isConfirmDialogOpen,
    discardChanges.disabled,
    published,
    version,
    draft,
    handle,
    isPermissionsLoading,
    isPublished,
    permissions?.granted,
    t,
  ])
}

useDiscardChangesAction.action = 'discardChanges'
useDiscardChangesAction.displayName = 'DiscardChangesAction'
