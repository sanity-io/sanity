import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'
import {render} from 'vitest-browser-react'

import {testHelpers} from '../../../../test/browser/testHelpers'
import {CommentsInputStory} from './CommentInputStory'

describe('Comments', () => {
  describe('CommentInput', () => {
    it('Should render', async () => {
      render(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
    })

    it('Should be able to type into', async () => {
      const {insertPortableText} = testHelpers()
      render(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await insertPortableText('My first comment!', $editable)
      await expect.element($editable).toHaveTextContent('My first comment!')
    })

    it('Should bring up mentions menu when typing @', async () => {
      render(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await userEvent.keyboard('@')
      const $mentionsMenu = page.getByTestId('comments-mentions-menu')
      await expect.element($mentionsMenu).toBeVisible()
      await userEvent.keyboard('{Enter}')
      await expect.element($mentionsMenu).not.toBeInTheDocument()
      await expect
        .element(page.getByTestId('comment-mentions-loading-skeleton'))
        .toBeVisible()
    })

    it('Should bring up mentions menu when pressing the @ button, whilst retaining focus on PTE', async () => {
      render(<CommentsInputStory />)
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

      render(<CommentsInputStory onSubmit={submitted.resolve} />)
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
  })
})
