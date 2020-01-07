import React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'
import {useRouter} from 'part:@sanity/base/router'

export const HistoryRestoreAction = createAction(function RestoreRevisionAction({
  id,
  type,
  historyId,
  revision,
  onComplete
}) {
  const {restoreFrom}: any = useDocumentOperation(id, type)
  const router = useRouter()
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  return {
    label: 'Restore',
    onHandle: () => {
      setConfirmDialogOpen(true)
    },
    title: 'Restore to this version',
    dialog: isConfirmDialogOpen && {
      type: 'confirm',
      color: 'danger',
      onCancel: onComplete,
      onConfirm: () => {
        restoreFrom.execute(historyId, revision).then(result => {
          router.navigateIntent('edit', {id, type})
          onComplete()
        })
      },
      message: (
        <>
          <strong>Are you sure</strong> you want to restore this document?
        </>
      )
    }
  }
})
