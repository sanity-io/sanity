import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import NestedInputStory from './NestedInputStory'

const {render} = await import('vitest-browser-react')

describe('Portable Text Input', () => {
  describe('Nested inputs', () => {
    it('Writing new lines in a nested input, will not cause issues with the DOM selection', async () => {
      const {getFocusedPortableTextInput, insertPortableText, waitForFocusedNodeText, waitForSelectionOffsets} =
        testHelpers()
      render(<NestedInputStory />)

      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      await page.getByRole('button', {name: 'Insert Inline Object'}).click()

      // Wait for the edit dialog to appear
      const $dialog = page.getByTestId('popover-edit-dialog')
      await expect.element($dialog).toBeVisible()

      // Assertion: Object preview should be visible in the main editor
      const inlineObject = $portableTextInput.element().querySelector('.pt-inline-object')
      expect(inlineObject).toBeTruthy()

      // Find the nested portable text input within the dialog
      const $inlinePopover = $dialog.getByTestId('inlinePopover')
      await expect.element($inlinePopover).toBeVisible()

      // Get the nested textbox (caption field)
      const textboxElements = $inlinePopover.getByRole('textbox').elements()
      const lastTextbox = textboxElements[textboxElements.length - 1]
      expect(lastTextbox).toBeTruthy()

      const $nestedPTE = page.elementLocator(lastTextbox!)
      await expect.element($nestedPTE).toBeVisible()
      lastTextbox!.focus()

      await insertPortableText('1', $nestedPTE)
      await userEvent.keyboard('{Enter}')
      await insertPortableText('2', $nestedPTE)
      await userEvent.keyboard('{Enter}')
      await insertPortableText('3', $nestedPTE)

      await waitForFocusedNodeText('3')
      // Assert that it did receive the correct offsets
      await waitForSelectionOffsets({focus: 1, anchor: 1})

      // Assert that the selection isn't reset to the start of the line
      // See https://github.com/sanity-io/sanity/pull/5136
      await new Promise((r) => setTimeout(r, 1000)) // Wait for new props.value to be returned

      let failed = false
      try {
        await waitForSelectionOffsets({focus: 0, anchor: 0}, 100)
      } catch {
        // We expect this to throw with the timeout error
        failed = true
      }
      expect(failed).toBeTruthy()
    })
  })
})
