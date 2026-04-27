import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'
import {render} from 'vitest-browser-react'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {AnnotationsStory} from './AnnotationsStory'
import {MultipleAnnotationsStory} from './MultipleAnnotationsStory'

describe('Portable Text Input', () => {
  describe('Annotations', () => {
    it('Create a new link with keyboard only', async () => {
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers()
      render(<AnnotationsStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')

      await insertPortableText('Now we should insert a link.', $pte)

      // Backtrack and click link icon in menu bar
      await userEvent.keyboard('{ArrowLeft}')
      await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}')
      await page.getByRole('button', {name: 'Link'}).click()
      // Assertion: Wait for link to be re-rendered / PTE internal state to be done
      const $link = page.elementLocator($pte.element().querySelector('span[data-link]')!)
      await expect.element($link).toBeVisible()

      // Assertion: the annotation toolbar popover should not be visible
      await expect.element(page.getByTestId('annotation-toolbar-popover')).not.toBeVisible()

      const $linkEditPopover = page.getByTestId('popover-edit-dialog')
      const $linkInput = $linkEditPopover.getByLabelText('Link')

      // Now we check if the edit popover shows automatically
      await expect.element($linkInput).toBeInTheDocument()

      // Focus the URL input
      await $linkInput.element().focus()

      // Assertion: The URL input should be focused
      await expect.element($linkInput).toHaveFocus()

      // Type in the URL
      await userEvent.keyboard('https://www.sanity.io')

      // Assertion: The URL input should have the correct value
      await expect.element($linkInput).toHaveValue('https://www.sanity.io')

      // Close the popover
      await userEvent.keyboard('{Escape}')

      // Expect the editor to have focus after closing the popover
      await expect.element($pte).toHaveFocus()

      const $toolbarPopover = page.getByTestId('annotation-toolbar-popover')

      // Assertion: the annotation toolbar popover should be visible
      await expect.element(page.getByTestId('annotation-toolbar-popover')).toBeVisible()
      await expect.element($toolbarPopover).toBeVisible()

      // Assertion: tab works to get to the toolbar popover buttons
      await userEvent.keyboard('{Tab}')
      await expect.element(page.getByTestId('edit-annotation-button')).toHaveFocus()
      await userEvent.keyboard('{Tab}')
      await expect.element(page.getByTestId('remove-annotation-button')).toHaveFocus()
      await userEvent.keyboard('{Escape}')
      await expect.element($pte).toHaveFocus()
      await expect.element($toolbarPopover).toBeVisible()
      await new Promise((r) => setTimeout(r, 1000))
      await userEvent.keyboard('{Escape}')
      await new Promise((r) => setTimeout(r, 1000))
      // Assertion: escape closes the toolbar popover
      await expect.element($toolbarPopover).not.toBeVisible()
    })

    it(
      'Can create, and then open the existing annotation again for editing',
      async () => {
        const {getFocusedPortableTextEditor, insertPortableText} = testHelpers()
        render(<AnnotationsStory />)
        const $pte = await getFocusedPortableTextEditor('field-body')

        await insertPortableText('Now we should insert a link.', $pte)

        // Backtrack and click link icon in menu bar
        await userEvent.keyboard('{ArrowLeft}')
        await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}')
        await page.getByRole('button', {name: 'Link'}).click()
        // Assertion: Wait for link to be re-rendered / PTE internal state to be done
        const $link = page.elementLocator($pte.element().querySelector('span[data-link]')!)
        await expect.element($link).toBeVisible()

        // Assertion: the annotation toolbar popover should not be visible
        await expect.element(page.getByTestId('annotation-toolbar-popover')).not.toBeVisible()

        const $linkEditPopover = page.getByTestId('popover-edit-dialog')
        const $linkInput = $linkEditPopover.getByLabelText('Link')

        // Now we check if the edit popover shows automatically
        await expect.element($linkInput).toBeInTheDocument()

        // Focus the URL input
        await $linkInput.element().focus()

        // Assertion: The URL input should be focused
        await expect.element($linkInput).toHaveFocus()

        // Type in the URL
        await userEvent.keyboard('https://www.sanity.io')

        // Assertion: The URL input should have the correct value
        await expect.element($linkInput).toHaveValue('https://www.sanity.io')

        // Close the popover
        await userEvent.keyboard('{Escape}')

        // Expect the editor to have focus after closing the popover
        await expect.element($pte).toHaveFocus()

        // Assertion: the annotation toolbar popover should be visible
        await expect.element(page.getByTestId('annotation-toolbar-popover')).toBeVisible()

        // Open up the editing interface again
        await page.getByTestId('edit-annotation-button').click()

        // Re-query the input since the popover was recreated
        const $linkInputReopened = page.getByTestId('popover-edit-dialog').getByLabelText('Link')
        await expect.element($linkInputReopened).toBeVisible()
        await expect.element($linkInputReopened).toBeEnabled()

        // Focus the URL input
        await $linkInputReopened.element().focus()

        // Assertion: The URL input should be focused
        await expect.element($linkInputReopened).toHaveFocus()
      },
      {timeout: 30_000},
    )

    it('Shows combined popover with multiple annotations on same text', async () => {
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers()
      render(<MultipleAnnotationsStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')

      await insertPortableText('Text with multiple annotations.', $pte)

      // Double-click on "annotations" to select it
      const $text = $pte.getByText('annotations')
      await userEvent.dblClick($text)

      // Add link annotation
      await page.getByRole('button', {name: 'Link'}).click()
      const $linkSpan = page.elementLocator($pte.element().querySelector('span[data-link]')!)
      await expect.element($linkSpan).toBeVisible()

      // Close the link edit popover
      const $linkEditPopover = page.getByTestId('popover-edit-dialog')
      const $linkInput = $linkEditPopover.getByLabelText('Link')
      await expect.element($linkInput).toBeInTheDocument()
      await $linkInput.element().focus()
      await userEvent.keyboard('https://www.sanity.io')
      await userEvent.keyboard('{Escape}')

      // Expect the editor to have focus after closing the popover
      await expect.element($pte).toHaveFocus()

      // Double-click on the linked text to reselect it and add highlight annotation
      // Use document.querySelector because after adding highlight, there will be nested span[data-link] elements
      const $linkedText = page.elementLocator(
        $pte.element().querySelector('span[data-link]')!,
      )
      await userEvent.dblClick($linkedText)

      // Add highlight annotation (the second annotation type)
      await page.getByRole('button', {name: 'Highlight'}).click()

      // Close the highlight edit popover
      const $highlightEditPopover = page.getByTestId('popover-edit-dialog')
      await expect.element($highlightEditPopover).toBeInTheDocument()
      const $stringInput = $highlightEditPopover.getByTestId('string-input')
      await expect.element($stringInput).toBeVisible()
      await expect.element($stringInput).toBeEnabled()
      await $stringInput.element().focus()
      await userEvent.keyboard('red')
      await userEvent.keyboard('{Escape}')

      // Expect the editor to have focus after closing the popover
      await expect.element($pte).toHaveFocus()

      // Double-click again to select the annotated text and trigger the popover
      const $linkedTextAgain = page.elementLocator(
        $pte.element().querySelector('span[data-link]')!,
      )
      await userEvent.dblClick($linkedTextAgain)

      // Assertion: the combined annotation toolbar popover should be visible
      const $toolbarPopover = page.getByTestId('annotation-toolbar-popover')
      await expect.element($toolbarPopover).toBeVisible()

      // Assertion: both annotation types should be shown in the popover
      // The popover should contain "Link" and "Highlight" text
      await expect.element($toolbarPopover.getByText('Link')).toBeVisible()
      await expect.element($toolbarPopover.getByText('Highlight')).toBeVisible()

      // Assertion: both edit buttons should be present (first one without index, second with index 1)
      await expect.element(page.getByTestId('edit-annotation-button')).toBeVisible()
      await expect.element(page.getByTestId('edit-annotation-button-1')).toBeVisible()

      // Assertion: both remove buttons should be present
      await expect.element(page.getByTestId('remove-annotation-button')).toBeVisible()
      await expect.element(page.getByTestId('remove-annotation-button-1')).toBeVisible()
    })
  })
})
