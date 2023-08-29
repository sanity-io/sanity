/* eslint-disable max-nested-callbacks */
import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {testHelpers} from '../../../utils/testHelpers'
import {DecoratorsStory} from './DecoratorsStory'

const DEFAULT_DECORATORS = [
  {
    name: 'strong',
    title: 'Strong',
    hotkey: 'b',
    icon: 'bold',
  },
  {
    name: 'em',
    title: 'Italic',
    hotkey: 'i',
    icon: 'italic',
  },
  {
    name: 'underline',
    title: 'Underline',
    hotkey: 'u',
    icon: 'underline',
  },
  {
    name: 'code',
    title: 'Code',
    hotkey: "'",
    icon: 'code',
  },
  {
    name: 'strike',
    title: 'Strike',
    hotkey: undefined, // Currently not defined
    icon: 'strikethrough',
  },
]

test.describe('Portable Text Input', () => {
  test.describe('Decorators', () => {
    test('Render default styles with keyboard shortcuts', async ({mount, page}) => {
      await page.evaluate(() => (window.localStorage.debug = 'sanity-pte:*'))
      const {getModifierKey, getFocusedPortableTextEditor, insertPortableText, toggleHotkey} =
        testHelpers({
          page,
        })
      await mount(<DecoratorsStory />)
      const $pte = await getFocusedPortableTextEditor('field-defaultDecorators')
      const modifierKey = getModifierKey()

      for (const decorator of DEFAULT_DECORATORS) {
        if (decorator.hotkey) {
          await toggleHotkey(decorator.hotkey, modifierKey)
          await insertPortableText(`${decorator.name} text 123`, $pte)
          await toggleHotkey(decorator.hotkey, modifierKey)
          await expect(
            $pte.locator(`[data-mark="${decorator.name}"]`, {
              hasText: `${decorator.name} text 123`,
            }),
          ).toBeVisible()
        }
      }
    })

    test.describe('Toolbar buttons', () => {
      test('Should display all default decorator buttons', async ({mount, page}) => {
        const {getFocusedPortableTextInput} = testHelpers({page})
        await mount(<DecoratorsStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-defaultDecorators')

        // Assertion: All buttons in the menu bar should be visible
        for (const decorator of DEFAULT_DECORATORS) {
          const $button = $portableTextInput.getByRole('button', {name: decorator.title})
          await expect($button).toBeVisible()
          await expect($button.locator(`svg[data-sanity-icon='${decorator.icon}']`)).toBeVisible()
        }
      })

      test('Should display custom decorator button and icon', async ({mount, page}) => {
        const {getFocusedPortableTextInput} = testHelpers({page})
        await mount(<DecoratorsStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-customDecorator')
        // Assertion: Button for highlight should exist
        const $highlightButton = $portableTextInput.getByRole('button', {name: 'Highlight'})
        await expect($highlightButton).toBeVisible()
        // Assertion: Icon for highlight should exist
        await expect($highlightButton.locator(`svg[data-sanity-icon='bulb-outline']`)).toBeVisible()
      })
    })
  })
})
