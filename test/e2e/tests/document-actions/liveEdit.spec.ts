import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test(`liveEdited document can be created, edited, and deleted`, async ({
  page,
  createDraftDocument,
}) => {
  const name = 'Test Name'

  await createDraftDocument('/content/playlist')
  await page.getByText('select the publish document to edit it')
  // Navigate to the published perspective
  await page.getByRole('button', {name: 'Published'}).click()
  // Wait a little bit for the document to load
  await page.waitForTimeout(2_000)

  await page.getByTestId('field-name').getByTestId('string-input').fill(name)

  // Wait a little bit for the document to start saving
  await page.waitForTimeout(2_000)

  await page.getByTestId('action-menu-button').click()
  await page.getByTestId('action-Delete').click()
  await expect(page.getByTestId('pane-footer-document-status')).toBeHidden()
  await page.getByRole('button', {name: 'Delete now'}).click()

  await expect(page.getByText('The document was successfully deleted')).toBeVisible()
})
