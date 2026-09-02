import {RevertIcon} from '@sanity/icons/Revert'
import {useCallback, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDialogProps,
  getPairTarget,
  useAsyncOperation,
  useDocumentOperation,
  useTranslation,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {structureLocaleNamespace} from '../i18n'
import {useDocumentPane} from '../panes/document/useDocumentPane'

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const useHistoryRestoreAction: DocumentActionComponent = ({id, type, revision}) => {
  const {revisionNotFound, targetDocumentState} = useDocumentPane()
  // The scope of the document targeted by the selected perspective (undefined when the target is
  // still resolving or the draft/published pair applies). While resolving, the action is disabled
  // below instead of silently operating on the base pair.
  const isTargetReady = targetDocumentState.status === 'ready'
  const {restore} = useDocumentOperation(id, type, getPairTarget(targetDocumentState))
  const restoreAsync = useAsyncOperation(restore)
  const {navigateIntent} = useRouter()
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const {t} = useTranslation(structureLocaleNamespace)

  const handleConfirm = useCallback(() => {
    setConfirmDialogOpen(false)
    // Await the outcome of this specific restore call: navigate only when it succeeded
    // (errors surface through the global operation-events toast).
    void restoreAsync.execute(revision!).then((outcome) => {
      if (outcome.type === 'success') {
        navigateIntent('edit', {id, type})
      }
    })
  }, [restoreAsync, revision, navigateIntent, id, type])

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
  }, [])

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  const dialog: DocumentActionDialogProps | null = useMemo(() => {
    if (isConfirmDialogOpen) {
      return {
        type: 'confirm',
        tone: 'critical',
        onCancel: handleCancel,
        onConfirm: handleConfirm,
        message: t('action.restore.confirm.message'),
      }
    }

    return null
  }, [handleConfirm, handleCancel, isConfirmDialogOpen, t])

  const isRevisionInitial = revision === '@initial'
  const isRevisionLatest = revision === undefined // undefined means latest revision

  return useMemo(() => {
    if (isRevisionLatest || revisionNotFound) {
      return null
    }

    return {
      label: t('action.restore.label'),
      tone: 'caution',
      onHandle: handle,
      title: t(
        isRevisionInitial
          ? 'action.restore.disabled.cannot-restore-initial'
          : 'action.restore.tooltip',
      ),
      icon: RevertIcon,
      dialog,
      disabled: isRevisionInitial || !isTargetReady || restoreAsync.isPending,
    }
  }, [
    dialog,
    handle,
    isRevisionInitial,
    isRevisionLatest,
    isTargetReady,
    restoreAsync.isPending,
    revisionNotFound,
    t,
  ])
}

useHistoryRestoreAction.action = 'restore'
useHistoryRestoreAction.displayName = 'HistoryRestoreAction'
