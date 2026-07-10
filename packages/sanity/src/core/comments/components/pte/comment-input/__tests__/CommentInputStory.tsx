import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {useState} from 'react'
import {CommentInput} from 'sanity'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type UserListWithPermissionsHookValue} from '../../../../../hooks/useUserListWithPermissions'

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

const MENTION_DATA: UserListWithPermissionsHookValue = {
  data: [
    {
      id: 'l33t',
      displayName: 'Test Person',
      email: 'test@test.com',
      granted: true,
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

  // Real consumers clear their draft state when a comment is submitted.
  const handleSubmit = () => {
    setValueState(null)
    onSubmit()
  }

  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <CommentInput
        focusOnMount
        placeholder="Your comment..."
        focusLock
        currentUser={currentUser}
        onChange={setValueState}
        value={valueState}
        mentionOptions={MENTION_DATA}
        onDiscardConfirm={onDiscardConfirm}
        onDiscardCancel={onDiscardCancel}
        onSubmit={handleSubmit}
      />
    </TestWrapper>
  )
}
