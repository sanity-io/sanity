/* eslint-disable react/jsx-handler-names */
import React from 'react'
import {useString} from '@sanity/ui-workshop'
import {useCurrentUser} from '../../store'
import {CommentsList} from '../components'
import {CommentsProvider} from '../context'
import {useComments} from '../hooks'

export default function CommentsProviderStory() {
  const _type = useString('_type', 'author') || 'author'
  const _id = useString('_id', 'grrm') || 'grrm'

  return (
    <CommentsProvider documentType={_type} documentId={_id}>
      <Inner />
    </CommentsProvider>
  )
}

function Inner() {
  const {comments, create, edit, mentionOptions, remove} = useComments()
  const currentUser = useCurrentUser()

  if (!currentUser) return null

  return (
    <CommentsList
      comments={comments.data.open}
      currentUser={currentUser}
      error={comments.error}
      loading={comments.loading}
      mentionOptions={mentionOptions}
      onDelete={remove.execute}
      onEdit={edit.execute}
      onNewThreadCreate={create.execute}
      onReply={create.execute}
      status="open"
      onCreateRetry={() => {
        // ...
      }}
    />
  )
}
