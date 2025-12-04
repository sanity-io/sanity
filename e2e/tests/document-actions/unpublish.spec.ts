import {expect} from '@playwright/test'

import {
  expectCreatedStatus,
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
  // Wait for the document to finish saving
  await expectCreatedStatus(documentStatus)

  // Wait for the document to be published.
  await publishButton.click()
  await expectPublishedStatus(documentStatus)

  const documentPerspectiveList = page.getByTestId('document-perspective-list')
  const publishedButton = documentPerspectiveList.getByRole('button', {
    name: 'Published',
    exact: true,
  })

  await expect(publishedButton).toBeEnabled()
  await publishedButton.click()
  await expect(unpublishButton).toBeVisible()
  await unpublishButton.click()

  await expect(unpublishModal).toBeVisible({timeout: 4_000})
  await page.getByTestId('confirm-button').click()

  // Check the published button is disabled that is the reference to determine the published document doesn't exist.
  await expect(publishedButton).toBeDisabled()

  const draftButton = documentPerspectiveList.getByRole('button', {
    name: 'Draft',
    exact: true,
  })
  await expect(draftButton).toBeEnabled()
  await draftButton.click()

  await expectUnpublishedStatus(documentStatus)
})
