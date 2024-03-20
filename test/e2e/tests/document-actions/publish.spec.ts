import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test(`document panel displays correct title for published document`, async ({
  page,
  createDraftDocument,
}) => {
  const title = 'Test Title'

  await createDraftDocument('/test/content/book')
  await page.getByTestId('field-title').getByTestId('string-input').fill(title)

  // Ensure the correct title is displayed before publishing.
  await expect(page.getByTestId('document-panel-document-title')).toHaveText(title)

  // Wait for the document to be published.
  page.getByTestId('action-Publish').click()
  await expect(page.getByText('Published just now')).toBeVisible()

  // Ensure the correct title is displayed after publishing.
  expect(page.getByTestId('document-panel-document-title')).toHaveText(title)
})
