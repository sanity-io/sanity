import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {testHelpers} from '../../../utils/testHelpers'
import {StylesStory} from './StylesStory'

const DEFAULT_STYLE_NAMES = [
  'Normal',
  'Heading 1',
  'Heading 2',
  'Heading 3',
  'Heading 4',
  'Heading 5',
  'Heading 6',
  'Quote',
]

test.describe('Styles', () => {
  test.describe('Toolbar', () => {
    test('Should display all default styles in style selector when clicked', async ({
      mount,
      page,
    }) => {
      const {getFocusedPortableTextInput} = testHelpers({page})
      await mount(<StylesStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-defaultStyles')
      const $styleSelectButton = await $portableTextInput.locator('button#block-style-select')
      await $styleSelectButton.click()

      for (const styleName of DEFAULT_STYLE_NAMES) {
        await expect(
          page.locator('button[role="menuitem"]').filter({hasText: styleName}),
        ).toBeVisible()
      }
    })

    test('Should not display block style button when no block styles are present', async ({
      mount,
      page,
    }) => {
      const {getFocusedPortableTextInput} = testHelpers({page})
      await mount(<StylesStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-oneStyle')
      await expect($portableTextInput.locator('button#block-style-select')).not.toBeVisible()
    })
  })
})
