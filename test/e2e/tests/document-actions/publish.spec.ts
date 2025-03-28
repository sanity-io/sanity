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

  // Focus the publish button to trigger the tooltip showing the keyboard shortcut
  page.getByTestId('action-publish').focus()

  // There is a delay before the tooltip opens, let's explicitly wait for it
  await page.waitForTimeout(300)

  // Now look for the tooltip to appear, with platform-aware keyboard shortcuts
  // It'll have a data-testid of 'document-status-bar-hotkeys'
  await page.waitForSelector('[data-testid="document-status-bar-hotkeys"]')
  const hotkeys = page.getByTestId('document-status-bar-hotkeys')

  const isMac = await page.evaluate(() => /Mac|iPod|iPhone|iPad/.test(navigator.platform || ''))
  expect(hotkeys).toHaveText(isMac ? 'CtrlOptionP' : 'CtrlAltP')

  // Wait for the document to be published.
  page.getByTestId('action-publish').click()
  await expect(page.getByText('Published just now')).toBeVisible({timeout: 30_000})

  // Ensure the correct title is displayed after publishing.
  expect(page.getByTestId('document-panel-document-title')).toHaveText(title)
})

test(`custom publish action can patch document before publication`, async ({
  page,
  createDraftDocument,
}) => {
  const title = 'Test Title'

  const getPublishKeypress = () => page.locator('body').press('Control+Alt+p')
  const getDocumentStatus = () => page.getByTestId('pane-footer-document-status')
  const getTitleInput = () => page.getByTestId('field-title').getByTestId('string-input')
  const getPublishedAtInput = () => page.getByTestId('field-publishedAt').getByTestId('date-input')

  await createDraftDocument('/test/content/input-debug;documentActionsTest')
  await getTitleInput().fill(title)

  // Wait for the document to save before publishing.
  await expect(getDocumentStatus()).toContainText(/created/i, {useInnerText: true, timeout: 30_000})

  // Wait for the document to be published.
  //
  // Note: This is invoked using the publish keyboard shortcut, because the publish document action
  // has been overridden for the `documentActionsTest` type, and is not visible without opening the
  // document actions menu.
  await getPublishKeypress()
  await expect(getDocumentStatus()).toContainText('Published just now')

  // Ensure the custom publish action succeeded in setting the `publishedAt` field.
  await expect(getPublishedAtInput()).toHaveValue(/.*/)
})
