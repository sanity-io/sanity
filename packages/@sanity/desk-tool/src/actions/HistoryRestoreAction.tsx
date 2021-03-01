import {useDocumentOperation} from '@sanity/react-hooks'
import {useRouter} from 'part:@sanity/base/router'
import HistoryIcon from 'part:@sanity/base/history-icon'
import React, {useCallback, useMemo} from 'react'

export function HistoryRestoreAction({id, type, revision, onComplete}) {
  const {restore}: any = useDocumentOperation(id, type)
  const router = useRouter()
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const handleConfirm = useCallback(() => {
    restore.execute(revision)
    router.navigateIntent('edit', {id, type})
    onComplete()
  }, [revision, restore, router, onComplete, id, type])

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  const dialog = useMemo(() => {
    if (!error && isConfirmDialogOpen) {
      return {
        type: 'confirm',
        color: 'danger',
        onCancel: onComplete,
        onConfirm: handleConfirm,
        message: <>Are you sure you want to restore this document?</>,
      }
    }

    if (!error) {
      return null
    }

    return {
      type: 'error',
      onClose: () => setError(null),
      title: 'An error occured',
      content: error.message,
    }
  }, [error, handleConfirm, isConfirmDialogOpen, onComplete])

  const isRevisionInitialVersion = revision === '@initial'

  return {
    label: 'Restore',
    color: 'primary',
    onHandle: handle,
    title: isRevisionInitialVersion
      ? "You can't restore to the initial version"
      : 'Restore to this version',
    icon: HistoryIcon,
    dialog,
    disabled: isRevisionInitialVersion,
  }
}
