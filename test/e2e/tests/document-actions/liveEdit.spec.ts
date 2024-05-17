import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test(`liveEdited document can be created, edited, and deleted`, async ({
  page,
  createDraftDocument,
}) => {
  const name = 'Test Name'

  await createDraftDocument('/test/content/playlist')
  await page.getByTestId('field-name').getByTestId('string-input').fill(name)

  await page.getByTestId('action-menu-button').click()
  await page.getByTestId('action-Delete').click()
  await page.getByRole('button', {name: 'Delete now'}).click()

  await expect(page.getByText('The document was successfully deleted')).toBeVisible()
})
