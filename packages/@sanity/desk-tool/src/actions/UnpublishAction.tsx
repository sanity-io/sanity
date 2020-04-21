/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-no-bind */

import {useDocumentOperation} from '@sanity/react-hooks'
import CloseIcon from 'part:@sanity/base/close-icon'
import React from 'react'
import ConfirmUnpublish from '../components/ConfirmUnpublish'

const DISABLED_REASON_TITLE = {
  NOT_PUBLISHED: 'This document is not published'
}

export function UnpublishAction({id, type, draft, published, onComplete, liveEdit}) {
  if (liveEdit) {
    return null
  }

  const {unpublish}: any = useDocumentOperation(id, type)
  const [error, setError] = React.useState<Error | null>(null)
  const [didUnpublish, setDidUnpublish] = React.useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  const getDialog = () => {
    if (error) {
      return {
        type: 'error',
        onClose: () => setError(null),
        title: 'An error occured',
        content: error.message
      }
    }
    if (didUnpublish) {
      return {
        type: 'success',
        onClose: () => {
          setDidUnpublish(false)
        },
        title: 'Succesfully unpublished the document'
      }
    }
    if (isConfirmDialogOpen) {
      return {
        type: 'legacy',
        onClose: onComplete,
        title: 'Unpublish',
        content: (
          <ConfirmUnpublish
            draft={draft}
            published={published}
            onCancel={() => {
              setConfirmDialogOpen(false)
              onComplete()
            }}
            onConfirm={async () => {
              setConfirmDialogOpen(false)
              unpublish.execute()
              onComplete()
            }}
          />
        )
      }
    }
    return null
  }

  return {
    icon: CloseIcon,
    disabled: Boolean(unpublish.disabled),
    label: 'Unpublish',
    title: unpublish.disabled ? DISABLED_REASON_TITLE[unpublish.disabled] : '',
    onHandle: () => {
      setConfirmDialogOpen(true)
    },
    dialog: getDialog()
  }
}
