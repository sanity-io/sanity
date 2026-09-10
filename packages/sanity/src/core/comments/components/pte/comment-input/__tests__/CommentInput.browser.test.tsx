import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {useCallback, useState} from 'react'
import {CommentInput} from 'sanity'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type UserListWithPermissionsHookValue} from '../../../../../hooks/useUserListWithPermissions'

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

function CommentsInputHarness({
  onDiscardCancel = noop,
  onDiscardConfirm = noop,
  onSubmit = noop,
  value = null,
}: {
  onDiscardCancel?: () => void
  onDiscardConfirm?: () => void
  onSubmit?: (value: PortableTextBlock[]) => void
  value?: PortableTextBlock[] | null
}) {
  const [valueState, setValueState] = useState<PortableTextBlock[] | null>(value)

  const handleSubmit = useCallback(
    (nextValue: PortableTextBlock[]) => {
      // The Studio resets the `value` it passes to `CommentInput` after each
      // submit; the harness does the same.
      setValueState(null)
      onSubmit(nextValue)
    },
    [onSubmit],
  )

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

describe('Comments', () => {
  describe('CommentInput', () => {
    it('Should render', async () => {
      const {settleChromaticEndState} = testHelpers()
      void render(<CommentsInputHarness />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await expect.element($editable).toHaveFocus()
      // Clear :hover on the input card so the focus ring is not swapped for the
      // hover border (CommentInput CSS applies :hover after :focus-within).
      await settleChromaticEndState()
    })

    it('Should be able to type into', async () => {
      const {insertPortableText, settleChromaticEndState} = testHelpers()
      void render(<CommentsInputHarness />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await insertPortableText('My first comment!', $editable)
      await expect.element($editable).toHaveTextContent('My first comment!')
      await expect.element($editable).toHaveFocus()
      await settleChromaticEndState()
    })

    it('Should bring up mentions menu when typing @', async () => {
      // Selecting a mention leaves an animated loading skeleton; snapshot the
      // open mentions menu instead so Chromatic does not archive mid-skeleton.
      configure({disableAutoSnapshot: true})
      const {settleChromaticEndState} = testHelpers()
      void render(<CommentsInputHarness />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await userEvent.keyboard('@')
      const $mentionsMenu = page.getByTestId('comments-mentions-menu')
      await expect.element($mentionsMenu).toBeVisible()
      // Mentions close on click-outside; a real pointer park dismisses the menu.
      await settleChromaticEndState({parkPointer: false})
      await expect.element($mentionsMenu).toBeVisible()
      await takeSnapshot('mentions-menu-open')
      await userEvent.keyboard('{Enter}')
      await expect.element($mentionsMenu).not.toBeInTheDocument()
      await expect.element(page.getByTestId('comment-mentions-loading-skeleton')).toBeVisible()
    })

    it('Should bring up mentions menu when pressing the @ button, whilst retaining focus on PTE', async () => {
      // Mentions menu open/closed races the auto snapshot (same as typing @).
      configure({disableAutoSnapshot: true})
      const {settleChromaticEndState} = testHelpers()
      void render(<CommentsInputHarness />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      const $mentionButton = page.getByTestId('comment-input-mention-button')
      await expect.element($mentionButton).toBeVisible()
      await userEvent.click($mentionButton)
      const $mentionsMenu = page.getByTestId('comments-mentions-menu')
      await expect.element($mentionsMenu).toBeVisible()
      await expect.element($editable).toHaveFocus()
      await expect
        .poll(() => {
          const el = window.document.querySelector('[data-testid="comments-mentions-menu"]')
          return el instanceof HTMLElement ? Math.round(el.getBoundingClientRect().height) : 0
        })
        .toBeGreaterThan(0)
      // Real pointer park dismisses the mentions popover (click-outside).
      await settleChromaticEndState({parkPointer: false})
      await expect.element($mentionsMenu).toBeVisible()
      await takeSnapshot('mentions-menu-via-button')
    })

    it('Should be able to submit', async () => {
      const {insertPortableText} = testHelpers()
      let resolve!: () => void
      const submitted = Object.assign(new Promise<void>((r) => (resolve = r)), {resolve})

      void render(<CommentsInputHarness onSubmit={submitted.resolve} />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await userEvent.keyboard('{Enter}')
      await insertPortableText('This is a comment!', $editable)
      await expect.element($editable).toHaveTextContent('This is a comment!')
      const $sendButton = page.getByTestId('comment-input-send-button')
      await expect.element($sendButton).toBeEnabled()
      await userEvent.keyboard('{Enter}')
      await submitted
    })

    it('Should keep typed text on both sides of a mention, and remove only the mention on backspace', async () => {
      const {insertPortableText} = testHelpers()
      void render(<CommentsInputHarness />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()

      await insertPortableText('before ', $editable)
      await userEvent.keyboard('@')
      const $mentionsMenu = page.getByTestId('comments-mentions-menu')
      await expect.element($mentionsMenu).toBeVisible()
      await userEvent.keyboard('{Enter}')
      await expect.element(page.getByTestId('comment-mentions-loading-skeleton')).toBeVisible()

      await userEvent.keyboard('foo')
      await expect.element($editable).toHaveTextContent(/^before foo$/)

      // The mention registration must render its `children`: they carry the
      // editor's caret spacer, without which the caret cannot land on the
      // mention.
      await expect
        .poll(() => $editable.element().querySelector('[data-pt-inline="object"] [data-pt-spacer]'))
        .not.toBeNull()

      // The mention's visible chip sits in a `draggable` wrapper: it makes
      // the mention movable and, because a draggable element starts a drag
      // instead of a text selection, keeps the mention text unselectable.
      await expect
        .poll(() =>
          page
            .getByTestId('comment-mentions-loading-skeleton')
            .element()
            .closest('[draggable="true"]'),
        )
        .not.toBeNull()

      // 4 backspaces undo " foo", the 5th removes the mention itself.
      await userEvent.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}')
      await expect
        .element(page.getByTestId('comment-mentions-loading-skeleton'))
        .not.toBeInTheDocument()
      await expect.element($editable).toHaveTextContent(/^before$/)
    })

    it('Should start the next comment empty after submitting the previous one', async () => {
      const {insertPortableText} = testHelpers()
      let resolve!: (value: PortableTextBlock[]) => void
      const submitted = new Promise<PortableTextBlock[]>((r) => (resolve = r))

      void render(<CommentsInputHarness onSubmit={resolve} />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await insertPortableText('First comment', $editable)
      await expect.element(page.getByTestId('comment-input-send-button')).toBeEnabled()
      // Submit while ' typed' still sits in the mutation debounce, so the
      // discarded instance's teardown flush carries it.
      await userEvent.keyboard(' typed')
      await userEvent.keyboard('{Enter}')
      expect(textOf(await submitted)).toBe('First comment typed')

      await expect.element($editable).not.toHaveTextContent('First comment')

      await insertPortableText('Second comment', $editable)
      await expect.element($editable).toHaveTextContent(/^Second comment$/)
    })
  })
})

function textOf(value: PortableTextBlock[]): string {
  return value
    .map((block) =>
      Array.isArray(block.children)
        ? block.children.map((child) => ('text' in child ? child.text : '')).join('')
        : '',
    )
    .join('\n')
}
