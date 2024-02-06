/* eslint-disable react/jsx-handler-names */
import React from 'react'
import {useString, useSelect} from '@sanity/ui-workshop'
import {CommentsList} from '../components'
import {
  CommentsEnabledProvider,
  CommentsProvider,
  CommentsSetupProvider,
  CommentsUpsellProvider,
} from '../context'
import {useComments} from '../hooks'
import {ConditionalWrapper} from '../../../../ui-components/conditionalWrapper'
import {CommentsUIMode} from '../types'
import {useCurrentUser} from 'sanity'

const noop = () => {
  // ...
}
const MODES = {
  default: 'default',
  upsell: 'upsell',
} as const

export default function CommentsProviderStory() {
  const _type = useString('_type', 'author') || 'author'
  const _id = useString('_id', 'grrm') || 'grrm'
  const _mode = useSelect('_mode', MODES) || ('default' as keyof typeof MODES)

  return (
    <CommentsSetupProvider>
      <CommentsEnabledProvider documentType={_type} documentId={_id}>
        <CommentsProvider documentType={_type} documentId={_id}>
          <ConditionalWrapper
            condition={_mode === 'upsell'}
            // eslint-disable-next-line react/jsx-no-bind
            wrapper={(children) => <CommentsUpsellProvider>{children}</CommentsUpsellProvider>}
          >
            <Inner mode={_mode} />
          </ConditionalWrapper>
        </CommentsProvider>
      </CommentsEnabledProvider>
    </CommentsSetupProvider>
  )
}

function Inner({mode}: {mode: CommentsUIMode}) {
  const {comments, mentionOptions, operation} = useComments()
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
      onDelete={operation.remove}
      onEdit={operation.edit}
      onNewThreadCreate={operation.create}
      onReactionSelect={operation.react}
      onReply={operation.create}
      selectedPath={null}
      status="open"
      mode={mode}
    />
  )
}
