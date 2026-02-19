import {expect} from '@playwright/test'

import {expectCreatedStatus, expectPublishedStatus} from '../../helpers/documentStatusAssertions'
import {test} from '../../studio-test'
import {speciesDocumentNameAnonymousVersion} from '../releases/utils/__fixtures__/documents'
import {createDocument, getRandomReleaseId} from '../releases/utils/methods'

test(`document panel displays correct title for published document`, async ({
  page,
  createDraftDocument,
}) => {
  test.slow()
  const title = 'Test Title'

  await createDraftDocument('/content/book')
  await expect(page.getByTestId('field-title')).toBeVisible()
  await expect(page.getByTestId('field-title')).toBeEnabled()
  await page.getByTestId('field-title').getByTestId('string-input').fill(title)

  // Ensure the correct title is displayed before publishing.
  await expect(page.getByTestId('document-panel-document-title')).toHaveText(title)

  // Focus the publish button to trigger the tooltip showing the keyboard shortcut
  await page.getByTestId('action-publish').focus()

  // There is a delay before the tooltip opens, let's explicitly wait for it
  await page.waitForTimeout(300)

  // Now look for the tooltip to appear, with platform-aware keyboard shortcuts
  // It'll have a data-testid of 'document-status-bar-hotkeys'
  await expect(page.getByTestId('document-status-bar-hotkeys')).toBeVisible()
  const hotkeys = page.getByTestId('document-status-bar-hotkeys')

  const isMac = await page.evaluate(() => /Mac|iPod|iPhone|iPad/.test(navigator.platform || ''))
  await expect(hotkeys).toHaveText(isMac ? 'CtrlOptionP' : 'CtrlAltP')

  // Wait for the document to be published.
  await page.getByTestId('action-publish').click()
  await expectPublishedStatus(page.getByTestId('pane-footer-document-status'))

  // Ensure the correct title is displayed after publishing.
  await expect(page.getByTestId('document-panel-document-title')).toBeVisible()
  await expect(page.getByTestId('document-panel-document-title')).toHaveText(title)
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
  const paneFooter = page.getByTestId('pane-footer-document-status')

  await createDraftDocument('/content/input-debug;documentActionsTest')
  await titleInput.fill(title)

  // Wait for the document to save before publishing.
  await expectCreatedStatus(paneFooter)

  // Wait for the document to be published.
  //
  // Note: This is invoked using the publish keyboard shortcut, because the publish document action
  // has been overridden for the `documentActionsTest` type, and is not visible without opening the
  // document actions menu.
  await publishKeypress()
  await expectPublishedStatus(documentStatus)

  // Ensure the custom publish action succeeded in setting the `publishedAt` field.
  await expect(publishedAtInput).toHaveValue(/.*/)
})

test('publish action can publish anonymous version', async ({
  page,
  sanityClient,
  _testContext,
  browserName,
}) => {
  const bundle = `anon-${getRandomReleaseId()}`
  const canonicalId = _testContext.getUniqueDocumentId()

  const publishAction = page.getByTestId('action-publish')
  const documentStatus = page.getByTestId('pane-footer-document-status')
  const nameInput = page.getByTestId('field-name').getByTestId('string-input')
  const paneFooter = page.getByTestId('pane-footer-document-status')

  await createDocument(sanityClient, {
    ...speciesDocumentNameAnonymousVersion,
    _id: `versions.${bundle}.${canonicalId}`,
  })

  await page.goto(`${browserName}/content/species;${canonicalId}?perspective=${bundle}`)
  await nameInput.fill(`${speciesDocumentNameAnonymousVersion.name} - updated ${Date.now()}`)

  // Wait for the document to save before publishing.
  await expectCreatedStatus(paneFooter)

  // Wait for the document to be published.
  await publishAction.click()
  await expectPublishedStatus(documentStatus)
})
