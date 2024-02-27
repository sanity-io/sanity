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

  // Open the dialog.
  await page.getByRole('button', {name: fileName}).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  // Ensure the list contains one item.
  expect(item).toHaveCount(1)

  // Drop the file again; this time, while the dialog is open.
  //
  // - The drop event should not propagate to the parent.
  // - Therefore, the drop even should not cause the image to be added to the list again.
  await page.getByRole('dialog').dispatchEvent('drop', {dataTransfer})

  // Close the dialog.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()

  // Ensure the list still contains one item.
  expect(item).toHaveCount(1)
})
