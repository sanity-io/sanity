/* eslint-disable max-nested-callbacks */
import {expect, test} from '@playwright/experimental-ct-react'

import {testHelpers} from '../utils/testHelpers'
import {CommentsInputStory} from './CommentInputStory'

test.describe('Comments', () => {
  test.describe('CommentInput', () => {
    test('Should render', async ({mount, page}) => {
      await mount(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect($editable).toBeVisible()
    })

    test('Should be able to type into', async ({mount, page}) => {
      const {insertPortableText} = testHelpers({page})
      await mount(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect($editable).toBeEditable()
      await insertPortableText('My first comment!', $editable)
      await expect($editable).toHaveText('My first comment!')
    })

    test('Should bring up mentions menu when typing @', async ({mount, page}) => {
      await mount(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await $editable.waitFor({state: 'visible'})
      await page.keyboard.type('@')
      const $mentionsMenu = page.getByTestId('comments-mentions-menu')
      await $mentionsMenu.waitFor({state: 'visible'})
      await page.keyboard.press('Enter')
      await $mentionsMenu.waitFor({state: 'detached'})
      // TODO: find a way to mock `useUser`!
      await page.getByTestId('comment-mentions-loading-skeleton').waitFor({state: 'visible'})
    })

    test('Should bring up mentions menu when pressing the @ button, whilst retaining focus on PTE', async ({
      mount,
      page,
    }) => {
      await mount(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await $editable.waitFor({state: 'visible'})
      const $mentionButton = page.getByTestId('comment-input-mention-button')
      await $mentionButton.waitFor({state: 'visible'})
      await $mentionButton.click()
      await page.getByTestId('comments-mentions-menu').waitFor({state: 'visible'})
      await expect($editable).toBeFocused()
    })

    test('Should be able to submit', async ({mount, page}) => {
      const {insertPortableText} = testHelpers({page})
      let resolve!: () => void
      const submitted = Object.assign(new Promise<void>((r) => (resolve = r)), {resolve})

      // eslint-disable-next-line react/jsx-handler-names
      await mount(<CommentsInputStory onSubmit={submitted.resolve} />)
      const $editable = page.getByTestId('comment-input-editable')
      $editable.waitFor({state: 'visible'})
      await expect($editable).toBeEditable()
      // Test that blank comments can't be submitted
      await page.keyboard.press('Enter')
      await insertPortableText('This is a comment!', $editable)
      await expect($editable).toHaveText('This is a comment!')
      await page.keyboard.press('Enter')
      await submitted
    })
  })
})
