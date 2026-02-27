import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test(`liveEdited document can be created, edited, and deleted`, async ({
  page,
  createDraftDocument,
  browserName,
}) => {
  // there is something wrong with the firefox e2e test for this
  // where it's only opening the dialogue after two clicks
  test.skip(browserName === 'firefox')
  const name = 'Test Name'

  await createDraftDocument('/content/playlist')
  // Navigate to the published perspective
  const publishedButton = page.getByRole('button', {name: 'Published'})
  await expect(publishedButton).toBeVisible()
  await expect(publishedButton).toBeEnabled()
  await publishedButton.click()

  // Wait for the form field to be ready
  const nameField = page.getByTestId('field-name').getByTestId('string-input')
  await expect(nameField).toBeVisible()
  await expect(nameField).toBeEnabled()
  await nameField.fill(name)

  // Wait for the action menu button to be available
  const actionMenuButton = page.getByTestId('action-menu-button')
  await expect(actionMenuButton).toBeVisible({timeout: 30000})
  await expect(actionMenuButton).toBeEnabled()
  await actionMenuButton.click()

  const deleteAction = page.getByTestId('action-Delete')
  await expect(deleteAction).toBeVisible()
  await deleteAction.click()
  await expect(page.getByTestId('pane-footer-document-status')).toBeHidden()
  await expect(page.getByRole('button', {name: 'Delete all versions'})).toBeVisible()
  await page.getByRole('button', {name: 'Delete all versions'}).click()

  await expect(page.getByText('The document was successfully deleted')).toBeVisible()
})
