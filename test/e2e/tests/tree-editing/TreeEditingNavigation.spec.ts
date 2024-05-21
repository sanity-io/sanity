import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test.describe('basic - open and close', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    await createDraftDocument('/test/content/input-debug;objectsDebug')

    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
  })

  test(`opening - when creating new array item, the tree editing modal should open`, async ({
    page,
    createDraftDocument,
  }) => {
    await createDraftDocument('/test/content/input-debug;objectsDebug')

    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()

    const modal = await page.getByTestId('tree-editing-dialog')
    await expect(modal).toBeVisible()
  })

  test(`closing - when the modal is open, clicking the 'done button' will close it`, async ({
    page,
    createDraftDocument,
  }) => {
    await createDraftDocument('/test/content/input-debug;objectsDebug')

    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    const modal = await page.getByTestId('tree-editing-dialog')

    await page.getByRole('button', {name: 'Done'}).click()
    await expect(modal).not.toBeVisible()
  })
})

test(`blocked main document action when modal is open`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/input-debug;objectsDebug')

  await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()

  await page.getByTestId('action-Publish').isDisabled()
})
