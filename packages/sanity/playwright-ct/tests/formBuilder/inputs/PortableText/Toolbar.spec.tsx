/* eslint-disable max-nested-callbacks */
import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {testHelpers} from '../../../utils/testHelpers'
import {ToolbarStory} from './ToolbarStory'

test.describe('Portable Text Input', () => {
  test.describe('Toolbar', () => {
    test.use({viewport: {width: 1200, height: 1000}})

    test.describe('Adaptive size', () => {
      test('Overflow links should appear in the "Add" context menu', async ({mount, page}) => {
        const {getFocusedPortableTextInput} = testHelpers({page})
        await mount(<ToolbarStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        // Adjust the viewport size to make the Inline Object button hidden
        await page.setViewportSize({width: 800, height: 1000})

        const $contextMenuButton = $portableTextInput.getByTestId('insert-menu-button')

        // Assertion: Check if the context menu button is showing
        await expect($contextMenuButton).toBeVisible()

        // Assertion: Check if the Inline Object button is now hidden
        await expect(
          $portableTextInput.getByRole('button').filter({hasText: 'Inline Object'}),
        ).toBeHidden()

        await $contextMenuButton.click()

        // Assertion: Overflowing block link should appear in the “Add” menu button
        await expect(
          page.locator('[data-ui="MenuButton__popover"] [data-ui="Menu"]'),
        ).toContainText('Inline Object')
      })
    })
  })
})
