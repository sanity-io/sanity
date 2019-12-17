import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'

export default createAction(({id, type, draft, published}) => {
  const [isConfirming, setIsConfirming] = React.useState(false)
  const [deletedDocument, setDeletedDocument] = React.useState(null)

  const {delete: del, create} = useDocumentOperation(id, type)

  return {
    disabled: !draft && !published,
    label: isConfirming ? 'Confirm delete…' : 'Delete',
    handle: () => {
      if (isConfirming) {
        setDeletedDocument(draft)
        del()
      } else {
        setIsConfirming(true)
      }
    },
    snackbar: deletedDocument && {
      type: 'success',
      content: <div>Document deleted</div>,
      actionTitle: 'Undo',
      onAction: () => {
        // todo: reconsider supporting this as it will either leak drafts abstraction or be wrong
        // undoing here should probably be done in on a document operation level
        // it should restore only the draft | published that got deleted
        create(deletedDocument)
        setDeletedDocument(null)
        setIsConfirming(false)
      }
    }
  }
})
