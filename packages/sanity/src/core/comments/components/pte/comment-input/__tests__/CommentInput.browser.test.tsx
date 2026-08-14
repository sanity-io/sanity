import {type PortableTextBlock} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {CommentsInputStory} from './CommentInputStory'

describe('Comments', () => {
  describe('CommentInput', () => {
    it('Should render', async () => {
      void render(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
    })

    it('Should be able to type into', async () => {
      const {insertPortableText} = testHelpers()
      void render(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await insertPortableText('My first comment!', $editable)
      await expect.element($editable).toHaveTextContent('My first comment!')
    })

    it('Should bring up mentions menu when typing @', async () => {
      void render(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await userEvent.keyboard('@')
      const $mentionsMenu = page.getByTestId('comments-mentions-menu')
      await expect.element($mentionsMenu).toBeVisible()
      await userEvent.keyboard('{Enter}')
      await expect.element($mentionsMenu).not.toBeInTheDocument()
      await expect.element(page.getByTestId('comment-mentions-loading-skeleton')).toBeVisible()
    })

    it('Should bring up mentions menu when pressing the @ button, whilst retaining focus on PTE', async () => {
      void render(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      const $mentionButton = page.getByTestId('comment-input-mention-button')
      await expect.element($mentionButton).toBeVisible()
      await userEvent.click($mentionButton)
      await expect.element(page.getByTestId('comments-mentions-menu')).toBeVisible()
      await expect.element($editable).toHaveFocus()
    })

    it('Should be able to submit', async () => {
      const {insertPortableText} = testHelpers()
      let resolve!: () => void
      const submitted = Object.assign(new Promise<void>((r) => (resolve = r)), {resolve})

      void render(<CommentsInputStory onSubmit={submitted.resolve} />)
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
      void render(<CommentsInputStory />)
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

      void render(<CommentsInputStory onSubmit={resolve} />)
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
