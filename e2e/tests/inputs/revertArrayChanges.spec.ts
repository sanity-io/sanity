import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Array revert changes', () => {
  // eslint-disable-next-line max-statements
  test('should revert deletion of middle array item without duplicate key error', async ({
    page,
    createDraftDocument,
  }) => {
    test.slow()
    // Create a draft document
    await createDraftDocument('/content/input-standard;arraysTest')

    // Find the inlineEditingArray field
    await expect(page.getByTestId('field-inlineEditingArray')).toBeVisible()
    await expect(
      page.getByTestId('field-inlineEditingArray').getByTestId('add-single-object-button'),
    ).toBeVisible()
    await page
      .getByTestId('field-inlineEditingArray')
      .getByTestId('add-single-object-button')
      .click()

    await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

    /** item 1 */
    /** title */
    const itemTitleInput = page
      .getByTestId('nested-object-dialog')
      .getByTestId(/^field-inlineEditingArray\[_key=="[^"]+"\]\.title$/)
      .getByTestId('string-input')

    const itemDescriptionInput = page
      .getByTestId('nested-object-dialog')
      .getByTestId(/^field-inlineEditingArray\[_key=="[^"]+"\]\.description$/)
      .getByTestId('string-input')

    await expect(itemTitleInput).toBeVisible()
    await expect(itemTitleInput).toBeEnabled()
    await itemTitleInput.fill('Item 1')

    /** description */
    await expect(itemDescriptionInput).toBeVisible()
    await expect(itemDescriptionInput).toBeEnabled()
    await itemDescriptionInput.fill('description 1')
    const closeButton = page
      .getByTestId('nested-object-dialog')
      .getByRole('button', {name: 'Close dialog'})
    await expect(closeButton).toBeVisible()
    await expect(closeButton).toBeEnabled()
    await closeButton.click()
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

    /** item 2 */
    await page
      .getByTestId('field-inlineEditingArray')
      .getByTestId('add-single-object-button')
      .click()
    await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

    /** title */
    await expect(itemTitleInput).toBeVisible()
    await expect(itemTitleInput).toBeEnabled()
    await itemTitleInput.fill('Item 2')

    /** description */
    await expect(itemDescriptionInput).toBeVisible()
    await expect(itemDescriptionInput).toBeEnabled()
    await itemDescriptionInput.fill('description 2')
    await expect(closeButton).toBeVisible()
    await expect(closeButton).toBeEnabled()
    await closeButton.click()
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

    /** item 3 */
    await page
      .getByTestId('field-inlineEditingArray')
      .getByTestId('add-single-object-button')
      .click()
    await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

    await expect(itemTitleInput).toBeVisible()
    await expect(itemTitleInput).toBeEnabled()
    await itemTitleInput.fill('Item 3')
    await expect(itemDescriptionInput).toBeVisible()
    await expect(itemDescriptionInput).toBeEnabled()
    await itemDescriptionInput.fill('description 3')
    await expect(closeButton).toBeVisible()
    await expect(closeButton).toBeEnabled()
    await closeButton.click()
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

    /** publish */
    await expect(page.getByTestId('action-publish')).toBeVisible()
    await expect(page.getByTestId('action-publish')).toBeEnabled()
    await page.getByTestId('action-publish').click()

    /** click to review history pane */
    await expect(page.getByTestId('pane-footer-document-status')).toBeVisible()
    await expect(page.getByTestId('pane-footer-document-status')).toBeEnabled()
    await page.getByTestId('pane-footer-document-status').click()
    await expect(page.getByTestId('review-changes-pane').nth(1)).toBeVisible()

    /** delete middle item */
    await page.getByTestId('array-item-menu-button').nth(1).click()
    await expect(page.getByRole('menuitem', {name: 'Remove'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Remove'}).click()

    await expect(page.getByRole('button', {name: 'Item 2 description'})).not.toBeVisible()

    /** revert changes */
    const groupChangesButton = page.getByTestId(
      /group-change-revert-button-inlineEditingArray\[.*\]/,
    )

    await expect(groupChangesButton).toBeVisible()
    await expect(groupChangesButton).toBeVisible()
    await groupChangesButton.click()
    await expect(page.getByTestId('confirm-popover-confirm-button')).toBeVisible()
    await page.getByTestId('confirm-popover-confirm-button').click()

    /** check that the middle item has been restored after reverting the deletion */
    await expect(page.getByRole('button', {name: 'Item 1 description'})).toBeVisible()
    await expect(page.getByRole('button', {name: 'Item 2 description'})).toBeVisible()
    await expect(page.getByRole('button', {name: 'Item 3 description'})).toBeVisible()

    await expect(
      page.getByTestId('field-inlineEditingArray').getByTestId('change-bar-wrapper').nth(1),
    ).toBeVisible()
    await expect(
      page
        .getByTestId('field-inlineEditingArray')
        .getByTestId('change-bar-wrapper')
        .nth(1)
        .getByRole('button', {name: 'Item 2 description'}),
    ).toBeVisible()
    await expect(
      page.getByTestId('field-inlineEditingArray').getByTestId('change-bar-wrapper'),
    ).toHaveCount(3)

    await expect(page.getByTestId('alert-warning')).not.toBeVisible()
  })
})
