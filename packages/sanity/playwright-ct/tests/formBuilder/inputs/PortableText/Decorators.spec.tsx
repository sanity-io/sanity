import Os from 'os'
import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {testHelpers} from '../../../utils/testHelpers'
import {DecoratorsStory} from './DecoratorsStory'

const DEFAULT_DECORATORS = [
  {
    name: 'strong',
    title: 'Strong',
    hotkey: 'b',
  },
  {
    name: 'em',
    title: 'Italic',
    hotkey: 'i',
  },
  {
    name: 'underline',
    title: 'Underline',
    hotkey: 'u',
  },
  {
    name: 'code',
    title: 'Code',
    hotkey: "'",
  },
  {
    name: 'strike',
    title: 'Strike',
    hotkey: undefined, // Currently not defined
  },
]

test.describe('Decorators', () => {
  test.describe('Keyboard shortcuts', () => {
    test.beforeEach(({browserName}) => {
      test.skip(
        browserName === 'webkit' && Os.platform() === 'linux',
        'Skipping Webkit for Linux which currently is flaky with this test.',
      )
    })
    test('Render default styles with keyboard shortcuts', async ({mount, page}) => {
      const {getModifierKey, getFocusedPortableTextEditor, insertPortableText, toggleHotkey} =
        testHelpers({
          page,
        })
      await mount(<DecoratorsStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')
      const modifierKey = getModifierKey()

      // eslint-disable-next-line max-nested-callbacks
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
  })

  test.describe('Toolbar', () => {
    test('Should display all default decorator buttons', async ({mount, page}) => {
      const {getFocusedPortableTextInput} = testHelpers({page})
      await mount(<DecoratorsStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      // Assertion: All buttons in the menu bar should be visible
      for (const decorator of DEFAULT_DECORATORS) {
        await expect($portableTextInput.getByRole('button', {name: decorator.title})).toBeVisible()
      }
    })
  })
})
