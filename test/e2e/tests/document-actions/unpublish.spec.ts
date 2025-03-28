import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test(`should be able to unpublish a published document`, async ({page, createDraftDocument}) => {
  /** publish initial action */
  const titleA = 'Title A'

  const getDocumentStatus = () => page.getByTestId('pane-footer-document-status')
  const getPublishButton = () => page.getByTestId('action-publish')
  const getContextFooterMenu = () => page.getByTestId('action-menu-button')
  const getUnpublishButton = () => page.getByTestId('action-Unpublish')
  const getTitleInput = () => page.getByTestId('field-title').getByTestId('string-input')
  const getUnpublishModal = () =>
    page
      .getByTestId('document-panel-portal')
      .locator('div')
      .filter({hasText: 'Unpublish document?Are you'})
      .nth(1)

  await createDraftDocument('/test/content/book')
  await getTitleInput().fill(titleA)
  // Wait for the document to finish saving
  await expect(getDocumentStatus()).toContainText(/created/i, {useInnerText: true, timeout: 30_000})

  // Wait for the document to be published.
  await getPublishButton().click()
  await expect(getDocumentStatus()).toContainText('Published just now')

  await getContextFooterMenu().click()
  await expect(getUnpublishButton()).toBeVisible()
  await getUnpublishButton().click()

  await expect(getUnpublishModal()).toBeVisible({timeout: 4_000})
  await page.getByTestId('confirm-button').click()

  const documentPerspectiveList = page.getByTestId('document-perspective-list')
  const button = documentPerspectiveList.getByRole('button', {name: 'Published', exact: true})

  // Check the published button is disabled that is the reference to determine the published document doesn't exist.
  await expect(button).toBeDisabled()
  await expect(getDocumentStatus()).toContainText('Unpublished just now')
})
