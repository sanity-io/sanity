import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {expectCreatedStatus, expectPublishedStatus} from '../../helpers/documentStatusAssertions'

const name = 'Test Name'

test(`unpublished documents can be deleted`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/author')
  await page.getByTestId('field-name').getByTestId('string-input').fill(name)
  const paneFooter = page.getByTestId('pane-footer-document-status')

  // Wait for the document to save before deleting.
  await expectCreatedStatus(paneFooter)

  await page.getByTestId('action-menu-button').click()
  await page.getByTestId('action-Delete').click()
  await page.getByRole('button', {name: 'Delete now'}).click()

  await expect(page.getByText('The document was successfully deleted')).toBeVisible()
})

test(`published documents can be deleted`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/author')
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
  await page.getByRole('button', {name: 'Delete now'}).click()

  await expect(page.getByText('The document was successfully deleted')).toBeVisible()
})
