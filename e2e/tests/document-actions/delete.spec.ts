import {expect} from '@playwright/test'

import {expectCreatedStatus, expectPublishedStatus} from '../../helpers/documentStatusAssertions'
import {test} from '../../studio-test'

const name = 'Test Name'

test(`unpublished documents can't be deleted`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/content/author')
  await page.getByTestId('field-name').getByTestId('string-input').fill(name)
  const paneFooter = page.getByTestId('pane-footer-document-status')

  // Wait for the document to save before deleting.
  await expectCreatedStatus(paneFooter)

  await page.getByTestId('action-menu-button').click()
  await expect(page.getByTestId('action-Delete')).toBeHidden()
})

test(`published documents can be deleted`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/content/author')
  await page.getByTestId('field-name').getByTestId('string-input').fill(name)
  const paneFooter = page.getByTestId('pane-footer-document-status')
  const publishButton = page.getByTestId('action-publish')

  // Wait for the document to save before publishing.
  await expectCreatedStatus(paneFooter)

  // Wait for the document to be published.
  await publishButton.click()
  await expectPublishedStatus(paneFooter)

  await page.getByTestId('action-menu-button').click()
  await page.getByTestId('action-Delete').click()
  await page.getByRole('button', {name: 'Delete all versions'}).click()

  await expect(page.getByText('The document was successfully deleted')).toBeVisible()
})

test(`deleted document shows the right name from last revision`, async ({
  page,
  createDraftDocument,
}) => {
  test.slow()
  const documentName = 'John Doe'
  const publishButton = page.getByTestId('action-publish')
  const paneFooter = page.getByTestId('pane-footer-document-status')

  await createDraftDocument('/content/author')
  await page.getByTestId('field-name').getByTestId('string-input').fill(documentName)
  await expectCreatedStatus(paneFooter)

  // Save the current URL before deletion
  const documentUrl = page.url()

  // Verify the name is displayed correctly before deletion
  await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(documentName)

  // Publish the document, to allow deletion
  await publishButton.click()
  await expectPublishedStatus(paneFooter)

  // Delete the document
  await page.getByTestId('action-menu-button').click()
  await page.getByTestId('action-Delete').click()
  await page.getByRole('button', {name: 'Delete all versions'}).click()

  // Wait for deletion to complete
  await expect(page.getByText('The document was successfully deleted')).toBeVisible()

  // Navigate back to the original document URL once it's deleted since it navigates back to the initial structure
  await page.goto(documentUrl)

  // Verify that the form still shows the correct name from the last revision
  // The form should display the last revision document content
  await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(documentName)

  // Verify the document title in the header also shows the correct name
  await expect(page.getByTestId('document-panel-document-title')).toHaveText(documentName)
})
