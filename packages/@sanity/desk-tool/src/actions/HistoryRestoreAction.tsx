import {DocumentActionComponent, DocumentActionModalProps} from '@sanity/base'
import {useDocumentOperation} from '@sanity/base/hooks'
import {useRouter} from '@sanity/base/router'
import {RestoreIcon} from '@sanity/icons'
import React, {useCallback, useMemo, useState} from 'react'

export const HistoryRestoreAction: DocumentActionComponent = ({id, type, revision, onComplete}) => {
  const {restore}: any = useDocumentOperation(id, type)
  const router = useRouter()
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const handleConfirm = useCallback(() => {
    restore.execute(revision)
    router.navigateIntent('edit', {id, type})
    onComplete()
  }, [revision, restore, router, onComplete, id, type])

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  const modal: DocumentActionModalProps | null = useMemo(() => {
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

  return {
    label: 'Restore',
    color: 'primary',
    onHandle: handle,
    title: isRevisionInitialVersion
      ? "You can't restore to the initial version"
      : 'Restore to this version',
    icon: RestoreIcon,
    modal,
    disabled: isRevisionInitialVersion,
  }
}
