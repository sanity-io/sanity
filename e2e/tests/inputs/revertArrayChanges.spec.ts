import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Array revert changes', () => {
  test('should revert deletion of middle array item without duplicate key error', async ({
    page,
    createDraftDocument,
    sanityClient,
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
    await page
      .getByTestId('nested-object-dialog')
      .getByTestId(/^field-inlineEditingArray\[_key=="[^"]+"\]\.title$/)
      .getByTestId('string-input')
      .fill('Item 1')
    await page
      .getByTestId('nested-object-dialog')
      .getByTestId(/^field-inlineEditingArray\[_key=="[^"]+"\]\.description$/)
      .getByTestId('string-input')
      .fill('description 1')
    await page.getByRole('button', {name: 'Close dialog'}).click()
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

    /** item 2 */
    await page
      .getByTestId('field-inlineEditingArray')
      .getByTestId('add-single-object-button')
      .click()
    await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
    await page
      .getByTestId('nested-object-dialog')
      .getByTestId(/^field-inlineEditingArray\[_key=="[^"]+"\]\.title$/)
      .getByTestId('string-input')
      .fill('Item 2')
    await page
      .getByTestId('nested-object-dialog')
      .getByTestId(/^field-inlineEditingArray\[_key=="[^"]+"\]\.description$/)
      .getByTestId('string-input')
      .fill('description 2')
    await page.getByRole('button', {name: 'Close dialog'}).click()
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

    /** item 3 */
    await page
      .getByTestId('field-inlineEditingArray')
      .getByTestId('add-single-object-button')
      .click()
    await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
    await page
      .getByTestId('nested-object-dialog')
      .getByTestId(/^field-inlineEditingArray\[_key=="[^"]+"\]\.title$/)
      .getByTestId('string-input')
      .fill('Item 3')
    await page
      .getByTestId('nested-object-dialog')
      .getByTestId(/^field-inlineEditingArray\[_key=="[^"]+"\]\.description$/)
      .getByTestId('string-input')
      .fill('description 3')
    await page.getByRole('button', {name: 'Close dialog'}).click()
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

    /** publish */
    await page.getByTestId('action-publish').click()

    /** click to review history pane */
    await page.getByTestId('pane-footer-document-status').click()
    await expect(page.getByTestId('review-changes-pane').nth(1)).toBeVisible()

    /** delete middle item */
    await page.getByTestId('array-item-menu-button').nth(1).click()
    await expect(page.getByRole('menuitem', {name: 'Remove'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Remove'}).click()

    await expect(page.getByRole('button', {name: 'Item 2 description'})).not.toBeVisible()

    /** revert changes */
    await expect(page.getByTestId('group-change-undefined')).toBeVisible()
    await expect(page.getByTestId('group-change-revert-button-undefined')).toBeVisible()
    await page.getByTestId('group-change-revert-button-undefined').click()
    await expect(page.getByTestId('confirm-popover-confirm-button')).toBeVisible()
    await page.getByTestId('confirm-popover-confirm-button').click()

    /** check that the middle item is deleted */
    await expect(page.getByRole('button', {name: 'Item 1 description'})).toBeVisible()
    await expect(page.getByRole('button', {name: 'Item 2 description'})).toBeVisible()
    await expect(page.getByRole('button', {name: 'Item 3 description'})).toBeVisible()

    await expect(page.getByTestId('alert-non-unique-keys')).not.toBeVisible()
  })
})
