import {expect, test} from '@playwright/experimental-ct-react'

import {testHelpers} from '../../../utils/testHelpers'
import {AnnotationsStory} from './AnnotationsStory'
import {MultipleAnnotationsStory} from './MultipleAnnotationsStory'

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
      browserName,
    }) => {
      test.slow()
      test.skip(browserName === 'firefox', 'Firefox has timing issues with PTE editor interaction')
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

      // Re-query the input since the popover was recreated
      const $linkInputReopened = page.getByTestId('popover-edit-dialog').getByLabel('Link').first()
      await expect($linkInputReopened).toBeVisible()
      await expect($linkInputReopened).toBeEnabled()

      // Focus the URL input
      await $linkInputReopened.focus()

      // Assertion: The URL input should be focused
      await expect($linkInputReopened).toBeFocused()
    })

    test('Shows combined popover with multiple annotations on same text', async ({
      mount,
      page,
      browserName,
    }) => {
      test.skip(browserName === 'firefox', 'Firefox has timing issues with PTE selection events')
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers({
        page,
      })
      await mount(<MultipleAnnotationsStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')

      await insertPortableText('Text with multiple annotations.', $pte)

      // Double-click on "annotations" to select it
      const $text = $pte.getByText('annotations')
      await $text.dblclick()

      // Add link annotation
      await page.getByRole('button', {name: 'Link'}).click()
      await expect($pte.locator('span[data-link]')).toBeVisible()

      // Close the link edit popover
      const $linkEditPopover = page.getByTestId('popover-edit-dialog')
      const $linkInput = $linkEditPopover.getByLabel('Link').first()
      await expect($linkInput).toBeAttached({timeout: 10000})
      await $linkInput.focus()
      await page.keyboard.type('https://www.sanity.io')
      await page.keyboard.press('Escape')

      // Expect the editor to have focus after closing the popover
      await expect($pte).toBeFocused()

      // Double-click on the linked text to reselect it and add highlight annotation
      // Use .first() because after adding highlight, there will be nested span[data-link] elements
      const $linkedText = $pte.locator('span[data-link]').first()
      await $linkedText.dblclick()

      // Add highlight annotation (the second annotation type)
      await page.getByRole('button', {name: 'Highlight'}).click()

      // Close the highlight edit popover
      const $highlightEditPopover = page.getByTestId('popover-edit-dialog')
      await expect($highlightEditPopover).toBeAttached({timeout: 10000})
      await expect($highlightEditPopover.getByTestId('string-input')).toBeVisible()
      await expect($highlightEditPopover.getByTestId('string-input')).toBeEnabled()
      await $highlightEditPopover.getByTestId('string-input').focus()
      await page.keyboard.type('red')
      await page.keyboard.press('Escape')

      // Expect the editor to have focus after closing the popover
      await expect($pte).toBeFocused()

      // Double-click again to select the annotated text and trigger the popover
      await $linkedText.dblclick()

      // Assertion: the combined annotation toolbar popover should be visible
      const $toolbarPopover = page.getByTestId('annotation-toolbar-popover')
      await expect($toolbarPopover).toBeVisible()

      // Assertion: both annotation types should be shown in the popover
      // The popover should contain "Link" and "Highlight" text
      await expect($toolbarPopover.getByText('Link')).toBeVisible()
      await expect($toolbarPopover.getByText('Highlight')).toBeVisible()

      // Assertion: both edit buttons should be present (first one without index, second with index 1)
      await expect(page.getByTestId('edit-annotation-button')).toBeVisible()
      await expect(page.getByTestId('edit-annotation-button-1')).toBeVisible()

      // Assertion: both remove buttons should be present
      await expect(page.getByTestId('remove-annotation-button')).toBeVisible()
      await expect(page.getByTestId('remove-annotation-button-1')).toBeVisible()
    })
  })
})
