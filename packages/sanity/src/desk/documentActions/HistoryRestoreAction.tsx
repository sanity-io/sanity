import {RestoreIcon} from '@sanity/icons'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {deskLocaleNamespace} from '../i18n'
import {
  DocumentActionComponent,
  DocumentActionDialogProps,
  useDocumentOperation,
  useDocumentOperationEvent,
  useTranslation,
} from 'sanity'
import {useRouter} from 'sanity/router'

/** @internal */
export const HistoryRestoreAction: DocumentActionComponent = ({id, type, revision, onComplete}) => {
  const {restore} = useDocumentOperation(id, type)
  const event = useDocumentOperationEvent(id, type)
  const {navigateIntent} = useRouter()
  const prevEvent = useRef(event)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const {t} = useTranslation(deskLocaleNamespace)

  const handleConfirm = useCallback(() => {
    restore.execute(revision!)
    onComplete()
  }, [restore, revision, onComplete])

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
        onCancel: onComplete,
        onConfirm: handleConfirm,
        message: t('action.restore.confirm.message'),
      }
    }

    return null
  }, [handleConfirm, isConfirmDialogOpen, onComplete, t])

  const isRevisionInitialVersion = revision === '@initial'
  const isRevisionLatestVersion = revision === undefined // undefined means latest version

  if (isRevisionLatestVersion) {
    return null
  }

  return {
    label: t('action.restore.label'),
    color: 'primary',
    onHandle: handle,
    title: t(
      isRevisionInitialVersion
        ? 'action.restore.disabled.cannot-restore-initial'
        : 'action.restore.tooltip',
    ),
    icon: RestoreIcon,
    dialog,
    disabled: isRevisionInitialVersion,
  }
}

HistoryRestoreAction.action = 'restore'
