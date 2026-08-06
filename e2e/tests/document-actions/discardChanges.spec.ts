import {expect} from '@playwright/test'

import {
  expectCreatedOrEditedStatus,
  expectEditedStatus,
  expectPublishedStatus,
} from '../../helpers/documentStatusAssertions'
import {test} from '../../studio-test'

test(`it is possible to discard changes if a changed document has no published version`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/content/book')

  const titleInput = page.getByTestId('field-title').getByTestId('string-input')
  const actionMenuButton = page.getByTestId('action-menu-button')
  const discardChangesButton = page.getByTestId('action-Discardchanges')
  const deleteButton = page.getByTestId('action-Delete')
  const confirmButton = page.getByTestId('confirm-button')

  await titleInput.fill('This is a book')

  await actionMenuButton.click()
  await expect(deleteButton).toBeEnabled()
  await expect(discardChangesButton).toBeEnabled()
  await discardChangesButton.click()
  await confirmButton.click()
  await expect(
    page.getByText(
      'All changes has now been discarded. The discarded draft can still be recovered from history',
    ),
  ).toBeVisible()
})

test(`is possible to discard changes if a changed document has a published version`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/content/book')

  const titleInput = page.getByTestId('field-title').getByTestId('string-input')
  const publishButton = page.getByTestId('action-publish')
  const actionMenuButton = page.getByTestId('action-menu-button')
  const discardChangesButton = page.getByTestId('action-Discardchanges')
  const paneFooterDocumentStatus = page.getByTestId('pane-footer-document-status')

  await titleInput.fill('This is a book')
  // Wait for the document to actually finish saving before asserting the publish
  // button is enabled. Waiting for the status-pulse to be hidden is racy: the
  // pulse element is absent (and therefore "hidden") in the window *before* the
  // first sync starts, so that wait can resolve before the draft has been
  // persisted, leaving the publish button disabled with reason NO_CHANGES.
  // The status line only shows "Created"/"Edited" once syncing has settled and
  // the draft has unsaved-then-saved changes, which is the real precondition for
  // the button becoming enabled.
  await expectCreatedOrEditedStatus(paneFooterDocumentStatus)

  // Wait for the document to be publishable
  await expect(publishButton).toBeEnabled({timeout: 30_000})
  await publishButton.click()
  // Wait for the document to be published.
  await expectPublishedStatus(paneFooterDocumentStatus)

  await titleInput.fill('This is not a book')

  await actionMenuButton.click()
  await expect(discardChangesButton).toBeEnabled()
})

test(`displays the published document state after discarding changes`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/content/book')

  const titleInput = page.getByTestId('field-title').getByTestId('string-input')
  const publishButton = page.getByTestId('action-publish')
  const actionMenuButton = page.getByTestId('action-menu-button')
  const discardChangesButton = page.getByTestId('action-Discardchanges')
  const confirmButton = page.getByTestId('confirm-button')
  const paneFooterDocumentStatus = page.getByTestId('pane-footer-document-status')

  await titleInput.fill('This is a book')
  // Wait for the document to actually finish saving before asserting the publish
  // button is enabled. See the sibling test above for why the status-pulse
  // `toBeHidden()` wait is racy; the status line reaching "Created"/"Edited" is
  // the real "saved" signal.
  await expectCreatedOrEditedStatus(paneFooterDocumentStatus)

  // Wait for the document to be publishable
  await expect(publishButton).toBeEnabled()
  await publishButton.click()
  // Wait for the document to be published.
  await expectPublishedStatus(paneFooterDocumentStatus)

  // Change the title.
  await titleInput.fill('This is not a book')
  // Wait for the edit to finish saving. The document now has a published version,
  // so the status line shows "Edited" once the draft change has been persisted.
  await expectEditedStatus(paneFooterDocumentStatus)

  // Discard the change.
  await actionMenuButton.click()
  await discardChangesButton.click()
  await expect(confirmButton).toBeVisible()
  await confirmButton.click()

  // Ensure the initial title is displayed.
  await expect(titleInput).toHaveValue('This is a book')
})
