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
    test('Render default decorators with keyboard shortcuts', async ({mount, page}) => {
      const {
        getModifierKey,
        getFocusedPortableTextEditor,
        getFocusedPortableTextInput,
        insertPortableText,
        toggleHotkey,
      } = testHelpers({
        page,
      })
      await mount(<DecoratorsStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-defaultDecorators')
      const $pte = await getFocusedPortableTextEditor('field-defaultDecorators')
      const modifierKey = getModifierKey()

      for (const decorator of DEFAULT_DECORATORS) {
        if (decorator.hotkey) {
          // Turn on the decorator
          await toggleHotkey(decorator.hotkey, modifierKey)
          // Assertion: button was toggled
          await expect(
            $portableTextInput.locator(
              `button[data-testid="action-button-${decorator.name}"][data-selected]:not([disabled])`,
            ),
          ).toBeVisible()
          // Insert some text
          await insertPortableText(`${decorator.name} text 123`, $pte)
          // Turn off the decorator
          await toggleHotkey(decorator.hotkey, modifierKey)
          // Assertion: button was toggled
          await expect(
            $portableTextInput.locator(
              `button[data-testid="action-button-${decorator.name}"]:not([data-selected]):not([disabled])`,
            ),
          ).toBeVisible()
          // Assertion: text has the correct decorator value
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

        // Assertion: All buttons in the menu bar should be visible and have icon
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
