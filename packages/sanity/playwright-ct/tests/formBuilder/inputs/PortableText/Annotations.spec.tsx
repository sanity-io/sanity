import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {testHelpers} from '../../../utils/testHelpers'
import {AnnotationsStory} from './AnnotationsStory'

test.describe('Portable Text Input', () => {
  test.describe('Annotations', () => {
    test('Create a new link with keyboard only', async ({mount, page}) => {
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers({
        page,
      })
      await mount(<AnnotationsStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')

      await insertPortableText('Now we should insert a link.', $pte)

      // Backtrack and click link icon in menu bar
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
      await page.getByRole('button', {name: 'Link'}).click()
      // Assertion: Wait for link to be re-rendered / PTE internal state to be done
      await expect($pte.locator('span[data-link]')).toBeVisible()

      // Assertion: the annotation toolbar popover should not be visible
      await expect(page.getByTestId('annotation-toolbar-popover')).not.toBeVisible()

      // Now we check if the edit popover shows automatically
      await expect(page.getByLabel('Link').first()).toBeAttached({timeout: 10000})

      // Focus the URL input
      await page.getByLabel('Link').first().focus()

      // Assertion: The URL input should be focused
      await expect(page.getByLabel('Link').first()).toBeFocused()

      // Type in the URL
      await page.keyboard.type('https://www.sanity.io')

      // Close the popover
      await page.keyboard.press('Escape')

      // Expect the editor to have focus after closing the popover
      await expect($pte).toBeFocused()

      // Assertion: the annotation toolbar popover should be visible
      await expect(page.getByTestId('annotation-toolbar-popover')).toBeVisible()
    })
  })
})
