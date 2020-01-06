import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'
import CloseIcon from 'part:@sanity/base/close-icon'
import React from 'react'

export const UnpublishAction = createAction(function UnpublishAction({id, type, onComplete}) {
  const {unpublish}: any = useDocumentOperation(id, type)
  const [error, setError] = React.useState<Error | null>(null)
  return {
    icon: CloseIcon,
    disabled: Boolean(unpublish.disabled),
    label: 'Unpublish',
    title: unpublish.disabled ? unpublish.disabled : 'Unpublish this document',
    onHandle: () => {
      setError(null)
      unpublish.execute().then(onComplete, err => setError(err))
    },
    dialog: error && {
      type: 'error',
      onClose: () => setError(null),
      title: 'An error occured',
      content: error.message
    }
  }
})
