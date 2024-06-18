import {readFileSync} from 'node:fs'
import path from 'node:path'

import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {createFileDataTransferHandle} from '../../helpers'

const fileName = 'capybara.jpg'
const image = readFileSync(path.join(__dirname, '..', '..', 'resources', fileName))

test(`file drop event should not propagate to dialog parent`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-standard;arraysTest')

  const list = page.getByTestId('field-arrayOfMultipleTypes').locator('#arrayOfMultipleTypes')
  const item = list.locator('[data-ui="Grid"] > div')

  const dataTransfer = await createFileDataTransferHandle(
    {page},
    {
      buffer: image,
      fileName,
      fileOptions: {
        type: 'image/jpeg',
      },
    },
  )

  // Drop the file.
  await list.dispatchEvent('drop', {dataTransfer})

  // Ensure the list contains one item.
  expect(item).toHaveCount(1)

  // Open the dialog.
  await page.getByRole('button', {name: fileName}).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  // Drop the file again; this time, while the dialog is open.
  //
  // - The drop event should not propagate to the parent.
  // - Therefore, the drop event should not cause the image to be added to the list again.
  await page.getByRole('dialog').dispatchEvent('drop', {dataTransfer})

  // Close the dialog.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()

  // Ensure the list still contains one item.
  expect(item).toHaveCount(1)
})

test(`Scenario: Adding a new type from multiple options`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/input-standard;arraysTest')

  // Given an empty array field allowing multiple types
  const field = page.getByTestId('field-arrayOfMultipleTypes')
  const noItemsLabel = field.getByText('No items')
  await expect(noItemsLabel).toBeVisible()

  // When the "Add item" button is clicked
  const addItemButton = field.getByRole('button', {name: 'Add item...'})
  await addItemButton.click()

  // Then an "insert menu" appears
  const insertMenuPopover = page.getByTestId('document-panel-portal')
  const insertMenu = insertMenuPopover.getByRole('menu')
  await expect(insertMenu).toBeVisible()

  // And when the "Book" menuitem is clicked
  const bookOption = insertMenu.getByRole('menuitem', {name: 'Book'})
  await bookOption.click()

  // Then an "insert dialog" appears
  const insertDialog = page.getByRole('dialog')
  await expect(insertDialog).toBeVisible()

  // And when the "Title" input is filled
  const titleInput = insertDialog.getByLabel('Title')
  await titleInput.fill('Book title')
  await expect(titleInput).toHaveValue('Book title')

  // And the dialog is closed
  const closeDialogButton = insertDialog.getByLabel('Close dialog')
  await closeDialogButton.click()
  await expect(insertDialog).not.toBeVisible()

  // Then a new item is inserted in the array
  const bookItem = field.getByText('Book title')
  await expect(bookItem).toBeVisible()
})
