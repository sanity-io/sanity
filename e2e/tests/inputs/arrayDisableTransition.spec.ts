/**
 * E2E test for PR #11775: disableTransition prop leak to DOM
 *
 * Issue: #11463
 * The Item component in list.tsx was spreading all props including `disableTransition`
 * to the ListItem component when sortable=false, causing React warnings about
 * unrecognized DOM attributes.
 *
 * The assertion lives in the DOM prop leak guard of the shared `watchForStudioErrors` watcher
 * (e2e/helpers/studioErrors.ts), which fails any test during which a prop such as
 * `disableTransition` reached a DOM element, against development and production builds alike.
 * This spec drives the scenario that used to leak it.
 */

import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('PR #11775 - disableTransition prop leak', () => {
  test('array items should not leak disableTransition prop to DOM when sortable=false', async ({
    page,
    createDraftDocument,
  }) => {
    // Navigate to a document with array fields
    await createDraftDocument('/content/input-standard;arraysTest')

    await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
      timeout: 40000,
    })

    // Add an item to the array to trigger the Item component render
    const field = page.getByTestId('field-arrayOfMultipleTypes')
    await expect(field).toBeVisible()

    const addItemButton = field.getByRole('button', {name: 'Add item...'})
    await addItemButton.click()

    const insertMenu = page.getByTestId('document-panel-portal').getByRole('menu')
    await expect(insertMenu).toBeVisible()

    // Add a Book item
    const bookOption = insertMenu.getByRole('menuitem', {name: 'Book'})
    await bookOption.click()

    // Wait for dialog and fill title
    const insertDialog = page.getByRole('dialog')
    await expect(insertDialog).toBeVisible()

    const titleInput = insertDialog.getByLabel('Title')
    await titleInput.fill('Test Book')

    // Close dialog - retry Escape if the dialog doesn't close (the dialog in
    // the document-panel-portal may not have focus, especially in Firefox)
    await page.keyboard.press('Escape')
    const dialogClosed = await insertDialog
      .waitFor({state: 'hidden', timeout: 5_000})
      .then(() => true)
      .catch(() => false)
    if (!dialogClosed) {
      await page.keyboard.press('Escape')
    }
    await expect(insertDialog).not.toBeVisible()

    // Wait for item to be rendered; the studio error watcher fails the test if
    // a prop leaked onto a DOM element along the way.
    const bookItem = field.getByText('Test Book')
    await expect(bookItem).toBeVisible()
  })
})
