import * as React from 'react'
import {useDocumentOperations} from '../test-action-tool/useDocumentOperations'

export default function DeleteAction(docInfo) {
  const [isConfirming, setIsConfirming] = React.useState(false)
  const [deletedDocument, setDeletedDocument] = React.useState(null)

  const ops = useDocumentOperations(docInfo.id, docInfo.type)

  return {
    disabled: !docInfo.draft && !docInfo.published,
    label: isConfirming ? 'Confirm delete…' : 'Delete',
    handle: () => {
      if (isConfirming) {
        setDeletedDocument(docInfo.draft)
        ops.delete()
      } else {
        setIsConfirming(true)
      }
    },
    snackbar: deletedDocument && {
      type: 'success',
      content: <div>Document deleted</div>,
      actionTitle: 'Undo',
      onAction: () => {
        ops.create(deletedDocument)
        setDeletedDocument(null)
        setIsConfirming(false)
      }
    }
  }
}
