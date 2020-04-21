/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-no-bind */

import React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import ConfirmDelete from '../components/ConfirmDelete'
import TrashIcon from 'part:@sanity/base/trash-icon'

const DISABLED_REASON_TITLE = {
  NOTHING_TO_DELETE: "This document doesn't yet exist or is already deleted"
}

export function DeleteAction({id, type, draft, published, onComplete}) {
  const {delete: deleteOp}: any = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  return {
    icon: TrashIcon,
    disabled: Boolean(deleteOp.disabled),
    title: (deleteOp.disabled && DISABLED_REASON_TITLE[deleteOp.disabled]) || '',
    label: isDeleting ? 'Deleting…' : 'Delete',
    shortcut: 'Ctrl+Alt+D',
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
            deleteOp.execute()
            onComplete()
          }}
        />
      )
    }
  }
}
