import {expect} from '@playwright/test'

import {
  expectCreatedOrEditedStatus,
  expectPublishedStatus,
  expectUnpublishedStatus,
} from '../../helpers/documentStatusAssertions'
import {test} from '../../studio-test'

test(`should be able to unpublish a published document`, async ({page, createDraftDocument}) => {
  /** publish initial action */
  const titleA = 'Title A'

  const documentStatus = page.getByTestId('pane-footer-document-status')
  const publishButton = page.getByTestId('action-publish')
  const unpublishButton = page.getByTestId('action-unpublish')
  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  const unpublishModal = page
    .getByTestId('document-panel-portal')
    .locator('div')
    .filter({hasText: 'Unpublish document?Are you'})
    .nth(1)

  await createDraftDocument('/content/book')
  await titleInput.fill(titleA)
  // Wait for the document to finish saving (may show Created or Edited depending on timing)
  await expectCreatedOrEditedStatus(documentStatus)

  // Wait for the document to be published.
  await publishButton.click()
  await expectPublishedStatus(documentStatus)

  const inventoryButton = page.getByTestId('action-document-group-inventory')
  const inventory = page.getByTestId('document-group-inventory')

  const publishedVariant = inventory
    .locator('[data-variant-set="Published"]')
    .getByRole('button', {name: 'All users (Default)', exact: true})

  const draftVariant = inventory
    .locator('[data-variant-set="Draft"]')
    .getByRole('button', {name: 'All users (Default)', exact: true})

  // Open the inventory and switch to the published variant.
  await inventoryButton.click()
  await expect(publishedVariant).toBeVisible()
  await publishedVariant.click()

  // Close the inventory so the unpublish action is interactable.
  await inventoryButton.click()

  await expect(unpublishButton).toBeVisible()
  await unpublishButton.click()

  await expect(unpublishModal).toBeVisible({timeout: 4_000})
  await page.getByTestId('confirm-button').click()

  const draftsPerspectiveUrl = new URL(page.url())
  draftsPerspectiveUrl.searchParams.delete('perspective')

  await expect(unpublishButton).not.toBeVisible()
  await page.goto(draftsPerspectiveUrl.toString())

  // await expectEditedStatus(documentStatus)
  await expectUnpublishedStatus(documentStatus)

  // Once unpublished, the published variant no longer exists, so it's removed from the inventory.
  await inventoryButton.click()
  await expect(publishedVariant).toBeHidden()

  // Switch to the draft variant and confirm the document is unpublished.
  await expect(draftVariant).toBeVisible()
  await draftVariant.click()

  await expectUnpublishedStatus(documentStatus)
})
