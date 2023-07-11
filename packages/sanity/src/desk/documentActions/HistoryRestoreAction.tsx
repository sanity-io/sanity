import {RestoreIcon} from '@sanity/icons'
import React, {useCallback, useMemo, useState} from 'react'
import {DocumentActionComponent, DocumentActionDialogProps, useDocumentOperation} from 'sanity'
import {useRouter} from 'sanity/router'

/** @internal */
export const HistoryRestoreAction: DocumentActionComponent = ({id, type, revision, onComplete}) => {
  const {restore} = useDocumentOperation(id, type)
  const {navigateIntent} = useRouter()
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const handleConfirm = useCallback(() => {
    restore.execute(revision!)
    onComplete()
    // wrapping in setTimeout gives the onComplete time to finish before navigating
    setTimeout(() => navigateIntent('edit', {id, type}), 0)
  }, [restore, revision, navigateIntent, id, type, onComplete])

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
