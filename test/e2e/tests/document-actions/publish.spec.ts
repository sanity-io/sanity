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

test(`custom publish action can patch document before publication`, async ({
  page,
  createDraftDocument,
}) => {
  const title = 'Test Title'

  const publishKeypress = () => page.locator('body').press('Control+Alt+p')
  const documentStatus = page.getByTestId('pane-footer-document-status')
  const titleInput = page.getByTestId('field-title').getByTestId('string-input')
  const publishedAtInput = page.getByTestId('field-publishedAt').getByTestId('date-input')

  await createDraftDocument('/test/content/input-debug;documentActionsTest')
  await titleInput.fill(title)

  // Wait for the document to be published.
  //
  // Note: This is invoked using the publish keyboard shortcut, because the publish document action
  // has been overridden for the `documentActionsTest` type, and is not visible without opening the
  // document actions menu.
  await page.waitForTimeout(1_000)
  await publishKeypress()
  await expect(documentStatus).toContainText('Published just now')

  // Ensure the custom publish action succeeded in setting the `publishedAt` field.
  await expect(publishedAtInput).toHaveValue(/.*/)
})
