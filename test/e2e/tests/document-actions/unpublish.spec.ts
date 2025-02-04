import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test(`should be able to unpublish a published document`, async ({page, createDraftDocument}) => {
  /** publish initial action */
  const titleA = 'Title A'

  const documentStatus = page.getByTestId('pane-footer-document-status')
  const publishButton = page.getByTestId('action-publish')
  const contextFooterMenu = page.getByTestId('action-menu-button')
  const unpublishButton = page.getByTestId('action-Unpublish')
  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  const unpublishModal = page
    .getByTestId('document-panel-portal')
    .locator('div')
    .filter({hasText: 'Unpublish document?Are you'})
    .nth(1)

  await createDraftDocument('/test/content/book')
  await titleInput.fill(titleA)

  // Wait for the document to be published.
  await page.waitForTimeout(1_000)
  await publishButton.click()
  await expect(documentStatus).toContainText('Published just now')

  await contextFooterMenu.click()
  await expect(unpublishButton).toBeVisible()
  await unpublishButton.click()

  await page.waitForTimeout(1_000)

  await expect(unpublishModal).toBeVisible()
  await page.getByTestId('confirm-button').click()

  // Check the published button is disabled that is the reference to determine the published document doesn't exist.
  const button = await page.getByRole('button', {name: 'Published', exact: true})
  await expect(button).toBeDisabled()
  await expect(documentStatus).toContainText('Unpublished just now')
})
