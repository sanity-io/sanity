import {RestoreIcon} from '@sanity/icons'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  DocumentActionComponent,
  DocumentActionDialogProps,
  useDocumentOperation,
  useDocumentOperationEvent,
} from 'sanity'
import {useRouter} from 'sanity/router'

/** @internal */
export const HistoryRestoreAction: DocumentActionComponent = ({id, type, revision, onComplete}) => {
  const {restore} = useDocumentOperation(id, type)
  const event = useDocumentOperationEvent(id, type)
  const {navigateIntent} = useRouter()
  const prevEvent = useRef(event)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)

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
        message: <>Are you sure you want to restore this document?</>,
      }
    }

    return null
  }, [handleConfirm, isConfirmDialogOpen, onComplete])

  const isRevisionInitialVersion = revision === '@initial'
  const isRevisionLatestVersion = revision === undefined // undefined means latest version

  if (isRevisionLatestVersion) {
    return null
  }

  return {
    label: 'Restore',
    color: 'primary',
    onHandle: handle,
    title: isRevisionInitialVersion
      ? "You can't restore to the initial version"
      : 'Restore to this version',
    icon: RestoreIcon,
    dialog,
    disabled: isRevisionInitialVersion,
  }
}

HistoryRestoreAction.action = 'restore'
