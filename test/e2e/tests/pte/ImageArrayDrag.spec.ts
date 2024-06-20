import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test('Portable Text Input - Array Input of images dragging an image will not trigger range out of bounds (toast)', async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-standard;portable-text;pt_allTheBellsAndWhistles')

  // set up the portable text editor
  await page.getByTestId('field-body').focus()
  await page.getByTestId('field-body').click()

  page.on('dialog', async () => {
    await expect(page.getByTestId('insert-menu-auto-collapse-menu')).toBeVisible()
  })

  // open the insert menu
  await page
    .getByTestId('insert-menu-auto-collapse-menu')
    .getByRole('button', {name: 'Insert Image slideshow (block)'})
    .click()

  // set up for the PTE block
  await page.getByRole('button', {name: 'Add item'}).click()
  await page.getByTestId('file-input-multi-browse-button').click()
  await page.getByTestId('file-input-browse-button-sanity-default').click()

  // grab an image
  await page.getByRole('button', {name: 'capybara.jpg'}).click()
  await page.getByLabel('Edit Image With Caption').getByLabel('Close dialog').click()

  // grab drag element in array element
  await page.locator("[data-sanity-icon='drag-handle']").hover()

  // drag and drop element
  await page.mouse.down()
  await page.getByRole('button', {name: 'Add item'}).hover()
  await page.mouse.up()

  await page.locator(
    `:has-text("Failed to execute 'getRangeAt' on 'Selection': 0 is not a valid index.']`,
  )

  // check that the alert is not visible
  await expect(await page.getByRole('alert').locator('div').nth(1)).not.toBeVisible()
})
