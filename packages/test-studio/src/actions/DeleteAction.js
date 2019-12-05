import * as React from 'react'
import {create, del} from '../mockDocStateDatastore'

export default function DeleteAction(docInfo) {
  const [isConfirming, setIsConfirming] = React.useState(false)
  const [deletedDocument, setDeletedDocument] = React.useState(null)

  return {
    disabled: !docInfo.draft && !docInfo.published,
    label: isConfirming ? 'Confirm delete…' : 'Delete',
    handle: () => {
      if (isConfirming) {
        setDeletedDocument(docInfo.draft)
        del(docInfo.id)
      } else {
        setIsConfirming(true)
      }
    },
    snackbar: deletedDocument && {
      type: 'success',
      content: <div>Document deleted</div>,
      actionTitle: 'Undo',
      onAction: () => {
        create(docInfo.id, deletedDocument)
        setDeletedDocument(null)
        setIsConfirming(false)
      }
    }
  }
}
