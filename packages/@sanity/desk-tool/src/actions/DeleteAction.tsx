import React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/util/document-action-utils'
import ConfirmDelete from '../components/ConfirmDelete'
import Spinner from 'part:@sanity/components/loading/spinner'
import TrashIcon from 'part:@sanity/base/trash-icon'

export const DeleteAction = createAction(function DeleteAction({id, type, draft, published}) {
  const {delete: del}: any = useDocumentOperation(id, type)
  const [isDeleting] = React.useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  return {
    icon: isDeleting ? Spinner : TrashIcon,
    disabled: !draft && !published,
    label: 'Delete',
    onHandle: () => {
      setConfirmDialogOpen(true)
    },
    dialog: isConfirmDialogOpen && {
      type: 'fullscreen',
      content: (
        <ConfirmDelete
          draft={draft}
          published={published}
          onCancel={() => setConfirmDialogOpen(false)}
          onConfirm={() => {
            setConfirmDialogOpen(false)
            del()
          }}
        />
      )
    }
  }
})
