import {expect} from '@playwright/test'
import {test} from '@sanity/test'

const name = 'Test Name'

test(`unpublished documents can be deleted`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/author')
  await page.getByTestId('field-name').getByTestId('string-input').fill(name)

  await page.getByTestId('action-menu-button').click()
  await page.getByTestId('action-Delete').click()
  await page.getByRole('button', {name: 'Delete now'}).click()

  await expect(page.getByText('The document was successfully deleted')).toBeVisible()
})

test(`published documents can be deleted`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/author')
  await page.getByTestId('field-name').getByTestId('string-input').fill(name)
  const paneFooter = page.getByTestId('pane-footer-document-status')

  // `.fill` and `.click` can cause the draft creation and publish to happen at the same exact time.
  // We are waiting for 1s to make sure the draft actually gets created and click action is not too eager
  await page.waitForTimeout(1000)

  // Wait for the document to be published.
  await page.getByTestId('action-publish').click()
  expect(await paneFooter.textContent()).toMatch(/published/i)

  await page.getByTestId('action-menu-button').click()
  await page.getByTestId('action-Delete').click()
  await page.getByRole('button', {name: 'Delete now'}).click()

  await expect(page.getByText('The document was successfully deleted')).toBeVisible()
})
