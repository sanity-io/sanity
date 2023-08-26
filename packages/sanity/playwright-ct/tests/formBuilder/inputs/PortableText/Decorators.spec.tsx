import Os from 'os'
import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {testHelpers} from '../../../utils/testHelpers'
import {DecoratorsStory} from './DecoratorsStory'

test.beforeEach(({browserName}) => {
  test.skip(
    browserName === 'webkit' && Os.platform() === 'linux',
    'Skipping Webkit for Linux which currently is flaky with this test.',
  )
})

test.describe('Decorators', () => {
  test.describe('Keyboard shortcuts', () => {
    test('Render default styles with keyboard shortcuts', async ({mount, page}) => {
      const {getModifierKey, getFocusedPortableTextEditor, insertPortableText, toggleHotkey} =
        testHelpers({
          page,
        })
      await mount(<DecoratorsStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')
      const modifierKey = getModifierKey()

      // Bold
      await toggleHotkey('b', modifierKey)
      await insertPortableText('bold text 123', $pte)
      await toggleHotkey('b', modifierKey)
      await expect($pte.locator('[data-mark="strong"]', {hasText: 'bold text'})).toBeVisible()

      // Italic
      await toggleHotkey('i', modifierKey)
      await insertPortableText('italic text', $pte)
      await toggleHotkey('i', modifierKey)
      await expect($pte.locator('[data-mark="em"]', {hasText: 'italic text'})).toBeVisible()

      // Underline
      await toggleHotkey('u', modifierKey)
      await insertPortableText('underlined text', $pte)
      await toggleHotkey('u', modifierKey)
      await expect(
        $pte.locator('[data-mark="underline"]', {
          hasText: 'underlined text',
        }),
      ).toBeVisible()

      // Code
      await toggleHotkey("'", modifierKey)
      await insertPortableText('code text', $pte)
      await expect($pte.locator('[data-mark="code"]', {hasText: 'code text'})).toBeVisible()
      await toggleHotkey("'", modifierKey)
    })
  })

  test.describe('Menu bar', () => {
    test('Should display all default decorators', async ({mount, page}) => {
      const {getFocusedPortableTextInput} = testHelpers({page})
      await mount(<DecoratorsStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      // Assertion: All icons in the menu bar should be visible
      const ICONS = ['bold', 'code', 'italic', 'underline']
      for (const icon of ICONS) {
        await expect(
          $portableTextInput.getByRole('button').locator(`[data-sanity-icon="${icon}"]`),
        ).toBeVisible()
      }
    })
  })
})
