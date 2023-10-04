/* eslint-disable react/jsx-handler-names */
import React, {useMemo} from 'react'
import {useString} from '@sanity/ui-workshop'
import {useCurrentUser} from '../../store'
import {CommentsList} from '../components'
import {CommentsProvider} from '../context'
import {useComments} from '../hooks'

export default function CommentsProviderStory() {
  const _type = useString('_type', 'author') || 'author'
  const _id = useString('_id', 'grrm') || 'grrm'

  const documentValue = useMemo(
    () => ({
      _id,
      _type,
      _createdAt: '2021-01-01T00:00:00Z',
      _updatedAt: '2021-01-01T00:00:00Z',
      _rev: '',
    }),
    [_id, _type],
  )

  return (
    <CommentsProvider documentValue={documentValue}>
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
