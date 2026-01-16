/**
 * E2E test for PR #11779: Annotation reference click fix
 *
 * Issue: #10821
 * Clicking on a reference in block field annotation popovers didn't work,
 * while keyboard navigation did. The FocusLock whitelist function in
 * PopoverModal.tsx used isWithinPortal for rejection but never added it
 * to the acceptance condition.
 */

import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('PR #11779 - Annotation reference click in popover', () => {
  test.beforeEach(async ({page, createDraftDocument, browserName}) => {
    test.skip(browserName === 'firefox', 'Firefox has timing issues with PTE editor interaction')
    test.slow()

    await createDraftDocument('/content/input-standard;portable-text;pt_allTheBellsAndWhistles')

    // Set viewport to ensure consistent popover positioning
    await page.setViewportSize({width: 1920, height: 800})

    const pteEditor = page.getByTestId('field-text')
    const textBlock = pteEditor.locator(
      '[data-testid="text-block__text"]:not([data-read-only="true"])',
    )

    // Wait for text block to be editable
    await expect(textBlock).toBeVisible()
    await textBlock.click()
  })

  test('clicking reference in annotation popover should work', async ({page}) => {
    // Open the insert menu
    await expect(page.getByTestId('insert-menu-button')).toBeVisible()
    await page.getByTestId('insert-menu-button').click()

    // Insert an inline reference (which opens in a popover)
    const inlineRefButton = page
      .getByTestId('document-panel-portal')
      .getByTestId('inlineReference-insert-menu-button')

    await expect(inlineRefButton).toBeVisible()
    await inlineRefButton.click()

    // Wait for the popover edit dialog
    await expect(page.getByTestId('popover-edit-dialog')).toBeVisible()
    await expect(page.getByTestId('reference-input')).toBeVisible()

    // Open the reference autocomplete dropdown
    const openButton = page.getByTestId('reference-input').getByRole('button', {name: 'Open'})
    await expect(openButton).toBeVisible()
    await expect(openButton).toBeEnabled()
    await openButton.click()

    // The autocomplete popover should appear
    await expect(page.getByTestId('autocomplete-popover')).toBeVisible()

    // Wait for results to load
    const firstResult = page
      .locator('[data-testid="autocomplete-popover"] [data-testid="default-preview"]')
      .first()
    await expect(firstResult).toBeVisible({timeout: 10000})

    // Click on the first result - this is the key interaction that was broken
    // Before the fix, clicks on portal elements inside the annotation popover were blocked
    await firstResult.click()

    // The popover should still be visible and the reference should be selected
    await expect(page.getByTestId('popover-edit-dialog')).toBeVisible()

    // The reference input should now show the selected reference
    const referencePreview = page.getByTestId('popover-edit-dialog').getByTestId('default-preview')
    await expect(referencePreview).toBeVisible()
  })

  test('keyboard navigation in annotation reference autocomplete should work', async ({page}) => {
    // Open the insert menu
    await page.getByTestId('insert-menu-button').click()

    // Insert inline reference
    await page
      .getByTestId('document-panel-portal')
      .getByTestId('inlineReference-insert-menu-button')
      .click()

    await expect(page.getByTestId('popover-edit-dialog')).toBeVisible()

    // Open autocomplete
    await page.getByTestId('reference-input').getByRole('button', {name: 'Open'}).click()
    await expect(page.getByTestId('autocomplete-popover')).toBeVisible()

    // Wait for results
    await expect(
      page.locator('[data-testid="autocomplete-popover"] [data-testid="default-preview"]').first(),
    ).toBeVisible({timeout: 10000})

    // Use keyboard to select (this worked before the fix, but click didn't)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // Reference should be selected
    await expect(page.getByTestId('popover-edit-dialog')).toBeVisible()
    await expect(
      page.getByTestId('popover-edit-dialog').getByTestId('default-preview'),
    ).toBeVisible()
  })
})
