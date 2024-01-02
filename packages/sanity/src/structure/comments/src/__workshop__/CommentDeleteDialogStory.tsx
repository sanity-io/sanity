import React from 'react'
import {useAction, useBoolean} from '@sanity/ui-workshop'
import {CommentDeleteDialog} from '../components'

export default function CommentDeleteDialogStory() {
  const isParent = useBoolean('Is parent', false, 'Props') || false
  const error = useBoolean('Error', false, 'Props') || false
  const loading = useBoolean('Loading', false, 'Props') || false

  return (
    <CommentDeleteDialog
      commentId="123"
      error={error ? new Error('Something went wrong') : null}
      isParent={isParent}
      loading={loading}
      onClose={useAction('onClose')}
      onConfirm={useAction('onConfirm')}
    />
  )
}
