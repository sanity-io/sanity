import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('In PTE - references in popover', () => {
  test.beforeEach(async ({page, createDraftDocument}, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 60_000)
    await createDraftDocument('/content/input-standard;portable-text;pt_allTheBellsAndWhistles')

    // Important since the having two documents side by side is vital to the test
    // Also, it needs to have a shorter height as to force the popover to always go on top vs bottom (make tests consistent)
    await page.setViewportSize({width: 1920, height: 800})

    const pteEditor = page.getByTestId('field-text')
    // Wait for the text block to be editable
    await expect(
      pteEditor.locator('[data-testid="text-block__text"]:not([data-read-only="true"])'),
    ).toBeVisible()
    // Set up the portable text editor
    await pteEditor.focus()
    await pteEditor.click()

    // Open the insert menu
    await page.getByTestId('insert-menu-button').click()

    // Set up the modal to open and reference input
    await expect(
      page.getByTestId('document-panel-portal').getByTestId('inlineReference-insert-menu-button'),
    ).toBeVisible()

    await page
      .getByTestId('document-panel-portal')
      .getByTestId('inlineReference-insert-menu-button')
      .click()

    await page.getByTestId('inline-preview').dblclick()

    await expect(page.getByTestId('popover-edit-dialog')).toBeVisible()

    await expect(page.getByTestId('reference-input')).toBeVisible()
  })

  test('you should be able to create a new reference document and change the fields while the popover is open', async ({
    page,
  }) => {
    // Create a new reference document
    await expect(page.locator('[data-testid^="create-new-document-select-text"]')).toBeVisible()
    await page.locator('[data-testid^="create-new-document-select-text"]').click()

    // A new document should open to the side and be untitled
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText('Untitled')

    // While the popover is open, we should be able to change the fields of the new document
    await page.getByTestId('string-input').nth(1).fill('Reference test')

    await expect(page.getByTestId('popover-edit-dialog')).toBeVisible()

    await expect(page.getByTestId('reference-input')).toBeVisible()
  })

  test('you should be able to add an existing document as reference and keep the link if picking a document that goes outside of the modal viewport', async ({
    page,
  }) => {
    test.slow()
    // Press arrow for existing references
    await expect(
      page.getByTestId('reference-input').getByRole('button', {name: 'Open'}),
    ).toBeVisible()
    await page.getByTestId('reference-input').getByRole('button', {name: 'Open'}).click()

    await expect(page.getByTestId('autocomplete-popover')).toBeVisible()

    // Wait for the autocomplete popover to be visible
    await expect(
      page.locator('[data-testid="autocomplete-popover"] [data-testid="default-preview"]').nth(1),
    ).toBeVisible()

    // We need to make sure that whatever item it picks
    // that it is outside of the scope of the PTE
    await expect(
      page
        .locator('[data-testid="autocomplete-popover"] [data-testid="default-preview"]')
        .nth(5)
        .getByTestId('default-preview__heading'),
    ).not.toBeVisible()

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('popover-edit-dialog')).toBeVisible()
    await expect(
      page
        .getByTestId('popover-edit-dialog')
        .getByTestId('default-preview')
        .getByTestId('default-preview__heading'),
    ).not.toBeVisible()
    await page.getByTestId('popover-edit-dialog').getByTestId('default-preview').click()

    const referencedDocumentTitle = page.getByTestId('document-panel-document-title').nth(1)
    await expect(referencedDocumentTitle).toBeVisible()

    // While the popover is open, we should be able to change the fields of the new document
    await page.getByTestId('string-input').nth(1).fill('Updated title')

    await expect(page.getByTestId('popover-edit-dialog')).toBeVisible()
    await expect(referencedDocumentTitle).toContainText('Updated title')
  })
})
