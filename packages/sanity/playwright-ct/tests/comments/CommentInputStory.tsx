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
        placeholder="Your comment..."
        focusLock
        currentUser={currentUser}
        onChange={setValueState}
        value={valueState}
        mentionOptions={{data: [], error: null, loading: false}}
        onDiscardConfirm={onDiscardConfirm}
        onDiscardCancel={onDiscardCancel}
        onSubmit={onSubmit}
      />
    </TestWrapper>
  )
}
