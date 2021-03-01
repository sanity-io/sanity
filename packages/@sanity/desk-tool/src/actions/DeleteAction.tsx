import {useDocumentOperation} from '@sanity/react-hooks'
import TrashIcon from 'part:@sanity/base/trash-icon'
import React, {useCallback} from 'react'
import ConfirmDelete from '../components/ConfirmDelete'

const DISABLED_REASON_TITLE = {
  NOTHING_TO_DELETE: "This document doesn't yet exist or is already deleted",
}

export function DeleteAction({id, type, draft, published, onComplete}) {
  const {delete: deleteOp}: any = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
    onComplete()
  }, [onComplete])

  const handleConfirm = useCallback(() => {
    setIsDeleting(true)
    setConfirmDialogOpen(false)
    deleteOp.execute()
    onComplete()
  }, [deleteOp, onComplete])

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  return {
    icon: TrashIcon,
    disabled: Boolean(deleteOp.disabled),
    title: (deleteOp.disabled && DISABLED_REASON_TITLE[deleteOp.disabled]) || '',
    label: isDeleting ? 'Deleting…' : 'Delete',
    shortcut: 'Ctrl+Alt+D',
    onHandle: handle,
    dialog: isConfirmDialogOpen && {
      type: 'legacy',
      onClose: onComplete,
      title: 'Delete',
      content: (
        <ConfirmDelete
          draft={draft}
          published={published}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      ),
    },
  }
}
