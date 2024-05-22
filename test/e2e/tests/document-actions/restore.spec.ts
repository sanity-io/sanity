import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test(`documents can be restored to an earlier revision`, async ({page, createDraftDocument}) => {
  const titleA = 'Title A'
  const titleB = 'Title B'

  const documentStatus = page.getByTestId('pane-footer-document-status')
  const publishButton = page.getByTestId('action-Publish')
  const restoreButton = page.getByTestId('action-Restore')
  const confirmButton = page.getByTestId('confirm-dialog-confirm-button')
  const timelineMenuOpenButton = page.getByTestId('timeline-menu-open-button')
  const timelineItemButton = page.getByTestId('timeline-item-button')
  const previousRevisionButton = timelineItemButton.nth(2)
  const title = page.getByTestId('document-panel-document-title')
  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/test/content/book')
  await titleInput.fill(titleA)

  // Wait for the document to be published.
  await page.waitForTimeout(1_000)
  await publishButton.click()
  await expect(documentStatus).toContainText('Published just now')

  // Change the title.
  await titleInput.fill(titleB)
  await expect(title).toHaveText(titleB)

  // Wait for the document to be published.
  await page.waitForTimeout(1_000)
  await publishButton.click()
  await expect(documentStatus).toContainText('Published just now')

  // Pick the previous revision from the revision timeline.
  await timelineMenuOpenButton.click()
  await expect(previousRevisionButton).toBeVisible()
  await previousRevisionButton.click({force: true})

  await expect(titleInput).toHaveValue(titleA)

  // Wait for the revision to be restored.
  await restoreButton.click()
  await confirmButton.click()
  await expect(title).toHaveText(titleA)
})
