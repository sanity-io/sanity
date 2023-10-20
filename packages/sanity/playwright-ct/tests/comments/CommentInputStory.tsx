import React, {useState} from 'react'
import {CurrentUser, PortableTextBlock} from '@sanity/types'
import {noop} from 'lodash'
import {CommentInput} from '../../../src/desk/comments/src/components/pte/comment-input/CommentInput'
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

export function CommentsInputStory() {
  const [value, setValue] = useState<PortableTextBlock[] | null>(null)

  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <CommentInput
        focusOnMount
        placeholder="Your comment..."
        focusLock
        currentUser={currentUser}
        onChange={setValue}
        value={value}
        mentionOptions={{data: [], error: null, loading: false}}
        onDiscardConfirm={noop}
        onDiscardCancel={noop}
        onSubmit={noop}
      />
    </TestWrapper>
  )
}
