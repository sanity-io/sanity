import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test(`document panel displays correct title after discarding changes`, async ({
  page,
  createDraftDocument,
}) => {
  /** ---------- START OF PUBLISH ---------- */

  const title = 'Test Title'
  const changedTitle = 'Title changed'

  await createDraftDocument('/test/content/book')
  await page.getByTestId('field-title').getByTestId('string-input').fill(title)

  // Ensure the correct title is displayed before publishing.
  await expect(page.getByTestId('document-panel-document-title')).toHaveText(title)

  // Focus the publish button to trigger the tooltip showing the keyboard shortcut
  page.getByTestId('action-publish').focus()

  // There is a delay before the tooltip opens, let's explicitly wait for it
  await page.waitForTimeout(300)

  // Wait for the document to be published.
  page.getByTestId('action-publish').click()
  await expect(page.getByText('Published just now')).toBeVisible()

  // Ensure the correct title is displayed after publishing.
  expect(page.getByTestId('document-panel-document-title')).toHaveText(title)

  /** ---------- END OF PUBLISH ---------- */

  // change title
  await page.getByTestId('field-title').getByTestId('string-input').fill(changedTitle)

  // open action menu
  page.getByTestId('action-menu-button').click()
  await expect(page.getByTestId('action-Discardchanges')).toBeVisible()

  // Discard changes
  page.getByTestId('action-Discardchanges').click()

  // confirm discard
  page.getByTestId('confirm-dialog-confirm-button').click()

  // Ensure the correct title is displayed after discarding changes.

  await expect(page.getByText('Published just now')).toBeVisible()
  expect(page.getByTestId('document-panel-document-title')).toHaveText(title)
})
