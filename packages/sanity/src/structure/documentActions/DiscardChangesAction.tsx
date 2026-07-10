import {ResetIcon} from '@sanity/icons/Reset'
import {useCallback, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  getPairTarget,
  getTargetScopeId,
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
  TARGET_NOT_FOUND: 'action.discard-changes.disabled.target-not-found',
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
  const {displayed, targetDocumentState} = useDocumentPane()
  // The scope of the document targeted by the selected perspective (undefined when the target is
  // still resolving or the draft/published pair applies). While resolving, the action is disabled
  // below instead of silently operating on the base pair.
  const isTargetReady = targetDocumentState.status === 'ready'
  const scopeId = getTargetScopeId(targetDocumentState)
  const {discardChanges} = useDocumentOperation(id, type, getPairTarget(targetDocumentState))
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: scopeId,
    permission: 'discardDraft',
  })
  const currentUser = useCurrentUser()

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
      disabled: Boolean(discardChanges.disabled) || isPermissionsLoading || !isTargetReady,
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
    isTargetReady,
    permissions?.granted,
    t,
  ])
}

useDiscardChangesAction.action = 'discardChanges'
useDiscardChangesAction.displayName = 'DiscardChangesAction'
