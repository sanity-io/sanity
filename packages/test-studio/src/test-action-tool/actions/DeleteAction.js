import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'

export default ({id, type, draft, published, onComplete}) => {
  const [isConfirming, setIsConfirming] = React.useState(false)
  const [deletedDocument, setDeletedDocument] = React.useState(null)

  const {delete: del, create} = useDocumentOperation(id, type)

  return {
    disabled: !draft && !published,
    label: isConfirming ? 'Confirm delete…' : 'Delete',
    onHandle: () => {
      if (isConfirming) {
        setDeletedDocument(draft)
        del.execute()
      } else {
        setIsConfirming(true)
      }
    },
    snackbar: deletedDocument && {
      type: 'success',
      content: <div>Document deleted</div>,
      actionTitle: 'Undo',
      onAction: () => {
        create.execute(deletedDocument)
        onComplete()
      },
    },
  }
}
