import {RevertIcon} from '@sanity/icons'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDialogProps,
  useDocumentOperation,
  useDocumentOperationEvent,
  useTranslation,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {structureLocaleNamespace} from '../i18n'
import {useDocumentPane} from '../panes/document/useDocumentPane'

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const useHistoryRestoreAction: DocumentActionComponent = ({id, type, revision, release}) => {
  const {restore} = useDocumentOperation(id, type, release)
  const {revisionNotFound} = useDocumentPane()
  const event = useDocumentOperationEvent(id, type)
  const {navigateIntent} = useRouter()
  const prevEvent = useRef(event)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const {t} = useTranslation(structureLocaleNamespace)

  const handleConfirm = useCallback(() => {
    restore.execute(revision!)
    setConfirmDialogOpen(false)
  }, [restore, revision])

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
  }, [])

  /**
   * If the restore operation is successful, navigate to the document edit view
   */
  useEffect(() => {
    if (!event || event === prevEvent.current) return

    if (event.type === 'success' && event.op === 'restore') {
      navigateIntent('edit', {id, type})
    }

    prevEvent.current = event
  }, [event, id, navigateIntent, type])

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
      disabled: isRevisionInitial,
    }
  }, [dialog, handle, isRevisionInitial, isRevisionLatest, revisionNotFound, t])
}

useHistoryRestoreAction.action = 'restore'
useHistoryRestoreAction.displayName = 'HistoryRestoreAction'
