/**
 * E2E test for PR #11775: disableTransition prop leak to DOM
 *
 * Issue: #11463
 * The Item component in list.tsx was spreading all props including `disableTransition`
 * to the ListItem component when sortable=false, causing React warnings about
 * unrecognized DOM attributes.
 */

import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('PR #11775 - disableTransition prop leak', () => {
  test('array items should not leak disableTransition prop to DOM when sortable=false', async ({
    page,
    createDraftDocument,
  }) => {
    // Collect console warnings
    const consoleWarnings: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        consoleWarnings.push(msg.text())
      }
    })

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

    // Close dialog
    await page.keyboard.press('Escape')
    await expect(insertDialog).not.toBeVisible()

    // Wait for item to be rendered
    const bookItem = field.getByText('Test Book')
    await expect(bookItem).toBeVisible()

    // Check that no React warning about disableTransition was logged
    const disableTransitionWarning = consoleWarnings.find(
      (warning) =>
        warning.includes('disableTransition') && warning.includes('React does not recognize'),
    )

    expect(disableTransitionWarning).toBeUndefined()
  })
})
