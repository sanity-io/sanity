import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test.describe('navigation - breadcrumb', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    // set up an array with two items: Albert, the whale and Lucy, the cat
    await createDraftDocument('/test/content/input-debug;objectsDebug')
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
      timeout: 40000,
    })

    // first element
    await expect(page.getByTestId('field-animals')).toBeVisible()
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await expect(page.getByTestId('array-editing-dialog')).toBeAttached()

    await page
      .getByTestId('array-editing-dialog')
      .getByTestId('string-input')
      .fill('Albert, the whale')
    await page.getByRole('button', {name: 'Done'}).click()

    // wait for the modal to close
    page.on('dialog', async () => {
      await expect(page.getByTestId('array-editing-dialog')).not.toBeVisible()
    })

    // second element
    await expect(page.getByTestId('field-animals')).toBeVisible()
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await expect(page.getByTestId('array-editing-dialog')).toBeAttached()

    await page.getByTestId('array-editing-dialog').getByTestId('string-input').fill('Lucy, the cat')
    await page.getByRole('button', {name: 'Done'}).click()

    /* structure:
    {
      Albert, the whale
      Lucy, the cat
    } */
  })
})
