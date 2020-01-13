import React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import ConfirmDelete from '../components/ConfirmDelete'
import TrashIcon from 'part:@sanity/base/trash-icon'

export function DeleteAction({id, type, draft, published, onComplete}) {
  const {delete: deleteOp}: any = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  return {
    icon: TrashIcon,
    disabled: Boolean(deleteOp.disabled),
    title: deleteOp.disabled ? `Cannot delete: ${deleteOp.disabled}` : '',
    label: isDeleting ? 'Deleting…' : 'Delete',
    shortcut: 'ctrl+alt+d',
    onHandle: () => {
      setConfirmDialogOpen(true)
    },
    dialog: isConfirmDialogOpen && {
      type: 'legacy',
      onClose: onComplete,
      title: 'Delete',
      content: (
        <ConfirmDelete
          draft={draft}
          published={published}
          onCancel={() => {
            setConfirmDialogOpen(false)
            onComplete()
          }}
          onConfirm={async () => {
            setIsDeleting(true)
            setConfirmDialogOpen(false)
            await deleteOp.execute()
            onComplete()
          }}
        />
      )
    }
  }
}
