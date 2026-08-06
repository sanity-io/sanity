import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import {useClickOutsideEvent} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {useCallback, useRef, useState} from 'react'
import {CommentInput, type CommentInputHandle} from 'sanity'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type UserListWithPermissionsHookValue} from '../../../../../hooks/useUserListWithPermissions'
import {getCommentsMentionsPopoverElement, hasCommentMessageValue} from '../../../../helpers'

const currentUser: CurrentUser = {
  email: '',
  id: '',
  name: '',
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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

/**
 * Mirrors InlineCommentInputPopover: click outside the composer opens discard
 * when there is a draft value. Mentions are portaled, so they must be excluded
 * from that outside check (SAPP-4093).
 */
function InlineComposerHarness() {
  const [value, setValue] = useState<PortableTextBlock[] | null>(null)
  const [discarded, setDiscarded] = useState(false)
  const commentInputRef = useRef<CommentInputHandle | null>(null)
  const contentElementRef = useRef<HTMLDivElement | null>(null)

  const handleDiscardConfirm = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
    setDiscarded(true)
    setValue(null)
  }, [])

  const handleDiscardCancel = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
  }, [])

  useClickOutsideEvent(
    () => {
      if (hasCommentMessageValue(value)) {
        commentInputRef.current?.discardDialogController.open()
        return
      }
      setDiscarded(true)
    },
    () => [contentElementRef.current, getCommentsMentionsPopoverElement()],
  )

  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <div data-testid="outside-area" style={{padding: 40}}>
        Outside
      </div>
      <div ref={contentElementRef} data-testid="inline-composer">
        <CommentInput
          currentUser={currentUser}
          focusLock
          focusOnMount
          mentionOptions={MENTION_DATA}
          onChange={setValue}
          onDiscardCancel={handleDiscardCancel}
          onDiscardConfirm={handleDiscardConfirm}
          onSubmit={noop}
          ref={commentInputRef}
          value={value}
        />
      </div>
      {discarded ? <div data-testid="composer-discarded">discarded</div> : null}
    </TestWrapper>
  )
}

describe('Inline comment composer mentions (SAPP-4093)', () => {
  it('selecting a mention from the portaled menu does not open discard', async () => {
    void render(<InlineComposerHarness />)

    const $editable = page.getByTestId('comment-input-editable')
    await expect.element($editable).toBeVisible()
    await userEvent.keyboard('@')

    const $mentionsMenu = page.getByTestId('comments-mentions-menu')
    await expect.element($mentionsMenu).toBeVisible()

    // Click the mention option (Card rendered as button).
    await userEvent.click($mentionsMenu.getByRole('button'))

    await expect.element(page.getByTestId('comment-mentions-loading-skeleton')).toBeVisible()
    await expect.element(page.getByText('Discard comment?')).not.toBeInTheDocument()
    await expect.element(page.getByTestId('composer-discarded')).not.toBeInTheDocument()
  })

  it('clicking truly outside still opens discard when the draft has a value', async () => {
    const {insertPortableText} = testHelpers()
    void render(<InlineComposerHarness />)

    const $editable = page.getByTestId('comment-input-editable')
    await expect.element($editable).toBeVisible()
    await insertPortableText('hello', $editable)
    await expect.element($editable).toHaveTextContent('hello')
    await expect.element(page.getByTestId('comment-input-send-button')).toBeEnabled()

    await userEvent.click(page.getByTestId('outside-area'))
    await expect.element(page.getByText('Discard comment?')).toBeVisible()
  })
})
