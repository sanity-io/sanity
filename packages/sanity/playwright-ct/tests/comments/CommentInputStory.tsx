import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import {noop} from 'lodash'
import React, {useState} from 'react'

import {type MentionOptionsHookValue} from '../../../src/structure/comments'
import {CommentInput} from '../../../src/structure/comments/src/components/pte/comment-input/CommentInput'
import {TestWrapper} from '../formBuilder/utils/TestWrapper'

const currentUser: CurrentUser = {
  email: '',
  id: '',
  name: '',
  role: '',
  roles: [],
  profileImage: '',
  provider: '',
}

const SCHEMA_TYPES: [] = []

const MENTION_DATA: MentionOptionsHookValue = {
  data: [
    {
      id: 'l33t',
      displayName: 'Test Person',
      email: 'test@test.com',
      canBeMentioned: true,
    },
  ],
  loading: false,
  error: null,
}

export function CommentsInputStory({
  onDiscardCancel = noop,
  onDiscardConfirm = noop,
  onSubmit = noop,
  value = null,
}: {
  onDiscardCancel?: () => void
  onDiscardConfirm?: () => void
  onSubmit?: () => void
  value?: PortableTextBlock[] | null
}) {
  const [valueState, setValueState] = useState<PortableTextBlock[] | null>(value)
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <CommentInput
        focusOnMount
        // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
        placeholder="Your comment..."
        focusLock
        currentUser={currentUser}
        onChange={setValueState}
        value={valueState}
        mentionOptions={MENTION_DATA}
        onDiscardConfirm={onDiscardConfirm}
        onDiscardCancel={onDiscardCancel}
        onSubmit={onSubmit}
      />
    </TestWrapper>
  )
}
