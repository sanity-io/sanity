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

  await page.getByTestId('action-Publish').click()
  await expect(page.getByText('was published')).toBeVisible()

  await page.getByTestId('action-menu-button').click()
  await page.getByTestId('action-Delete').click()
  await page.getByRole('button', {name: 'Delete now'}).click()

  await expect(page.getByText('The document was successfully deleted')).toBeVisible()
})
