import {expect, test} from '@playwright/experimental-ct-react'

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

      const $linkEditPopover = page.getByTestId('popover-edit-dialog')
      const $linkInput = $linkEditPopover.getByLabel('Link').first()

      // Now we check if the edit popover shows automatically
      await expect($linkInput).toBeAttached({timeout: 10000})

      // Focus the URL input
      await $linkInput.focus()

      // Assertion: The URL input should be focused
      await expect($linkInput).toBeFocused()

      // Type in the URL
      await page.keyboard.type('https://www.sanity.io')

      // Assetion: The URL input should have the correct value
      await expect($linkInput).toHaveValue('https://www.sanity.io')

      // Close the popover
      await page.keyboard.press('Escape')

      // Expect the editor to have focus after closing the popover
      await expect($pte).toBeFocused()

      const $toolbarPopover = page.getByTestId('annotation-toolbar-popover')

      // Assertion: the annotation toolbar popover should be visible
      await expect(page.getByTestId('annotation-toolbar-popover')).toBeVisible()
      await expect($toolbarPopover).toBeVisible()

      // Assertion: tab works to get to the toolbar popover buttons
      await page.keyboard.press('Tab')
      await expect(page.getByTestId('edit-annotation-button')).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(page.getByTestId('remove-annotation-button')).toBeFocused()
      await page.keyboard.press('Escape')
      await expect($pte).toBeFocused()
      await expect($toolbarPopover).toBeVisible()
      await page.waitForTimeout(1_000)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1_000)
      // Assertion: escape closes the toolbar popover
      await expect($toolbarPopover).not.toBeVisible()
    })

    test('Can create, and then open the existing annotation again for editing', async ({
      mount,
      page,
    }) => {
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

      const $linkEditPopover = page.getByTestId('popover-edit-dialog')
      const $linkInput = $linkEditPopover.getByLabel('Link').first()

      // Now we check if the edit popover shows automatically
      await expect($linkInput).toBeAttached({timeout: 10000})

      // Focus the URL input
      await $linkInput.focus()

      // Assertion: The URL input should be focused
      await expect($linkInput).toBeFocused()

      // Type in the URL
      await page.keyboard.type('https://www.sanity.io')

      // Assetion: The URL input should have the correct value
      await expect($linkInput).toHaveValue('https://www.sanity.io')

      // Close the popover
      await page.keyboard.press('Escape')

      // Expect the editor to have focus after closing the popover
      await expect($pte).toBeFocused()

      // Assertion: the annotation toolbar popover should be visible
      await expect(page.getByTestId('annotation-toolbar-popover')).toBeVisible()

      // Open up the editing interface again
      await page.getByTestId('edit-annotation-button').click()

      // Focus the URL input
      await $linkInput.focus()

      // Assertion: The URL input should be focused
      await expect($linkInput).toBeFocused()
    })
  })
})
