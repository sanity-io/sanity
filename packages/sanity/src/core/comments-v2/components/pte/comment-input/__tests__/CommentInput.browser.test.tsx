import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {useCallback, useState} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, server, userEvent} from 'vitest/browser'

import {expectStable, testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type UserListWithPermissionsHookValue} from '../../../../../hooks/useUserListWithPermissions'
import {CommentInput} from '../CommentInput'

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

/**
 * The input card paints its focus ring from React's `focused` state
 * (`data-focused`) combined with `:focus-within`, and lets `:hover` override
 * it with the hover border. Chromatic re-applies the recorded `:hover` /
 * `:focus` states when it renders the archive, so assert the ring's inputs
 * explicitly (after `settleChromaticEndState` has parked the pointer) instead
 * of relying on the editable's `toHaveFocus()` alone.
 *
 * Chromatic archives on chromium only. Firefox headless shares one window
 * focus across the pages Vitest runs test files in, so input in another
 * file's page blurs this editor (the editor emits `blurred` and `data-focused`
 * flips to `false`) while `document.activeElement` is unchanged; `toHaveFocus()`
 * still holds there, but the ring inputs cannot be asserted reliably.
 */
const commentInputRoot = () => window.document.getElementById('comment-input-root')

async function expectFocusRingSettled() {
  if (server.browser === 'firefox') return
  await expect.poll(() => commentInputRoot()?.getAttribute('data-focused')).toBe('true')
  await expect.poll(() => commentInputRoot()?.matches(':focus-within')).toBe(true)
  await expect.poll(() => commentInputRoot()?.matches(':hover')).toBe(false)
}

/** The mentions popover is positioned by Floating UI after it opens; wait for
 * it to be laid out at a size that stops changing before archiving it. */
async function expectMentionsMenuLaidOut() {
  const menuHeight = () => {
    const el = window.document.querySelector('[data-testid="comments-mentions-menu"]')
    return el instanceof HTMLElement ? Math.round(el.getBoundingClientRect().height) : 0
  }
  await expect.poll(menuHeight).toBeGreaterThan(0)
  expect(await expectStable(menuHeight)).toBeGreaterThan(0)
}

describe('Comments', () => {
  describe('CommentInput', () => {
    it('Should render', async () => {
      const {settleChromaticEndState} = testHelpers()
      void render(<CommentsInputHarness />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await expect.element($editable).toHaveFocus()
      await settleChromaticEndState()
      await expectFocusRingSettled()
    })

    it('Should be able to type into', async () => {
      const {insertPortableText, settleChromaticEndState} = testHelpers()
      void render(<CommentsInputHarness />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await insertPortableText('My first comment!', $editable)
      await expect.element($editable).toHaveTextContent('My first comment!')
      await expect.element($editable).toHaveFocus()
      // Typing enables the primary-tone send button; wait for that state
      // before archiving so the snapshot does not race the debounced change.
      await expect.element(page.getByTestId('comment-input-send-button')).toBeEnabled()
      await settleChromaticEndState()
      await expectFocusRingSettled()
    })

    it('Should bring up mentions menu when typing @', async () => {
      // Selecting a mention leaves an animated loading skeleton; archive the
      // open mentions menu (the test's end state) instead.
      const {settleChromaticEndState} = testHelpers()
      void render(<CommentsInputHarness />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await userEvent.keyboard('@')
      const $mentionsMenu = page.getByTestId('comments-mentions-menu')
      await expect.element($mentionsMenu).toBeVisible()
      await expectMentionsMenuLaidOut()
      await settleChromaticEndState()
      await expect.element($mentionsMenu).toBeVisible()
      await expect.element($editable).toHaveFocus()
      await expectFocusRingSettled()
    })

    it('Should bring up mentions menu when pressing the @ button, whilst retaining focus on PTE', async () => {
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
      await expectMentionsMenuLaidOut()
      await settleChromaticEndState()
      await expect.element($mentionsMenu).toBeVisible()
      await expect.element($editable).toHaveFocus()
      await expectFocusRingSettled()
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
      await expect.element(page.getByTestId('comment-input-send-button')).toBeEnabled()
      const {settleChromaticEndState} = testHelpers()
      await settleChromaticEndState()
      await expectFocusRingSettled()
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
