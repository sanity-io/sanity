/* eslint-disable react/jsx-handler-names */
import React from 'react'
import {useString} from '@sanity/ui-workshop'
import {CommentsList} from '../components'
import {CommentsProvider, CommentsSetupProvider} from '../context'
import {useComments} from '../hooks'
import {useCurrentUser} from 'sanity'

const noop = () => {
  // ...
}

export default function CommentsProviderStory() {
  const _type = useString('_type', 'author') || 'author'
  const _id = useString('_id', 'grrm') || 'grrm'

  return (
    <CommentsSetupProvider>
      <CommentsProvider documentType={_type} documentId={_id}>
        <Inner />
      </CommentsProvider>
    </CommentsSetupProvider>
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
      onCreateRetry={noop}
      onDelete={remove.execute}
      onEdit={edit.execute}
      onNewThreadCreate={create.execute}
      onReply={create.execute}
      selectedPath={null}
      status="open"
    />
  )
}
