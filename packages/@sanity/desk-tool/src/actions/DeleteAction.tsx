import React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'
import ConfirmDelete from '../components/ConfirmDelete'
import Spinner from 'part:@sanity/components/loading/spinner'
import TrashIcon from 'part:@sanity/base/trash-icon'
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const DeleteAction = createAction(function DeleteAction({
  id,
  type,
  draft,
  published,
  onComplete
}) {
  const {delete: deleteOp}: any = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  return {
    icon: isDeleting ? Spinner : TrashIcon,
    disabled: deleteOp.disabled,
    title: deleteOp.disabled ? `Cannot delete: ${deleteOp.disabled}` : '',
    label: isDeleting ? 'Deleting…' : 'Delete',
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
            await sleep(1000)
            await deleteOp.execute()
            onComplete()
          }}
        />
      )
    }
  }
})
