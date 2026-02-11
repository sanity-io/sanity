import {expect, test} from '@playwright/experimental-ct-react'
import {type Page} from '@playwright/test'

import {testHelpers} from '../../../utils/testHelpers'
import NestedInputStory from './NestedInputStory'

test.describe('Portable Text Input', () => {
  test.describe('Nested inputs', () => {
    test('Writing new lines in a nested input, will not cause issues with the DOM selection', async ({
      mount,
      page,
    }) => {
      const {getFocusedPortableTextInput, insertPortableText} = testHelpers({page})
      await mount(<NestedInputStory />)

      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      await page.getByRole('button', {name: 'Insert Inline Object'}).click()

      // Wait for the edit dialog to appear
      const $dialog = page.getByTestId('popover-edit-dialog')
      await expect($dialog).toBeVisible()

      // Assertion: Object preview should be visible in the main editor
      await expect($portableTextInput.locator('.pt-inline-object')).toBeVisible()

      // Find the nested portable text input within the dialog (the caption field)
      // The custom input wrapper is inside the dialog
      const $inlinePopover = $dialog.getByTestId('inlinePopover')
      await expect($inlinePopover).toBeVisible()

      const $nestedPortableTextInput = $inlinePopover.getByRole('textbox').last()
      await expect($nestedPortableTextInput).toBeVisible()
      await $nestedPortableTextInput.focus()
      await insertPortableText('1', $nestedPortableTextInput)
      await page.keyboard.press('Enter')
      await insertPortableText('2', $nestedPortableTextInput)
      await page.keyboard.press('Enter')
      await insertPortableText('3', $nestedPortableTextInput)
      await waitForFocusedNodeText(page, '3')
      // Assert that it did receive the correct offsets
      await waitForOffsets(page, {focus: 1, anchor: 1})
      // Assert that the selection isn't reset to the start of the line
      // See https://github.com/sanity-io/sanity/pull/5136
      // TODO: is there a better way to test this?
      await page.waitForTimeout(1000) // Wait for new props.value to be returned
      let failed = false
      try {
        await waitForOffsets(page, {focus: 0, anchor: 0})
      } catch (err) {
        // We expect this to throw with the timeout error
        // Re-throw everything else
        if (err.name !== 'TimeoutError') {
          throw err
        }
        failed = true
      }
      expect(failed).toBeTruthy()
    })
  })
})

function waitForOffsets(page: Page, {focus, anchor}: {focus: number; anchor: number}) {
  return page.waitForFunction(
    (arg) => {
      const sel = window.getSelection()
      return arg?.focus === sel?.focusOffset && arg?.anchor === sel?.anchorOffset
    },
    {focus, anchor},
    {timeout: 100},
  )
}

function waitForFocusedNodeText(page: Page, text: string) {
  return page.waitForFunction(
    (arg) => {
      return window.getSelection()?.focusNode?.textContent === arg
    },
    text,
    {timeout: 100},
  )
}
