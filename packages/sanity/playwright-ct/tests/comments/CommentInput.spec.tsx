import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
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
      await expect(page.getByTestId('comments-mentions-menu')).toBeVisible()
    })

    test('Should be able to submit', async ({mount, page}) => {
      const {insertPortableText} = testHelpers({page})
      let submitted = false
      const onSubmit = () => {
        submitted = true
      }
      await mount(<CommentsInputStory onSubmit={onSubmit} />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect($editable).toBeEditable()
      // Test that blank comments can't be submitted
      await page.keyboard.press('Enter')
      expect(submitted).toBe(false)
      await insertPortableText('This is a comment!', $editable)
      await expect($editable).toHaveText('This is a comment!')
      await page.keyboard.press('Enter')
      expect(submitted).toBe(true)
    })
  })
})
