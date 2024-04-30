import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test.describe('When pressing backspace with a block with a custom renderPreview', () => {
  test('an image block will be deleted', async ({page, createDraftDocument}) => {
    await createDraftDocument('/test/content/input-standard;portable-text;simpleBlock')

    // set up the portable text editor
    await page.getByTestId('field-blockPreview').focus()
    await page.getByTestId('field-blockPreview').click()

    await page.getByTestId('insert-menu-button').click()
    await page.getByTestId('document-panel-portal').getByLabel('Insert Image Component').click()

    await page.getByTestId('pte-block-object').click()
    await page.keyboard.down('Backspace')

    // check that the block is no longer in the input
    await expect(await page.getByTestId('pte-block-object')).not.toBeVisible()
  })

  test('a file block will be deleted', async ({page, createDraftDocument}) => {
    await createDraftDocument('/test/content/input-standard;portable-text;simpleBlock')

    // set up the portable text editor
    await page.getByTestId('field-blockPreview').focus()
    await page.getByTestId('field-blockPreview').click()

    await page.getByTestId('insert-menu-button').click()
    await page.getByTestId('document-panel-portal').getByLabel('Insert File Component').click()

    await page.getByTestId('pte-block-object').click()
    await page.keyboard.down('Backspace')

    // check that the block is no longer in the input
    await expect(await page.getByTestId('pte-block-object')).not.toBeVisible()
  })
})
