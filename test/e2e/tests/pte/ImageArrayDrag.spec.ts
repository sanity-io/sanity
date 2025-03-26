import {createReadStream} from 'node:fs'
import path from 'node:path'

import {expect} from '@playwright/test'
import {type SanityImageAssetDocument} from '@sanity/client'
import {test} from '@sanity/test'

import {withCrashRecovery} from '../../helpers/crashRecovery'

// Configure longer expect timeouts for these tests
const expectConfig = {timeout: 45000}

test.describe('Portable Text Input - ImageArrayDraft', () => {
  let uploadedAsset: SanityImageAssetDocument
  test.beforeAll(async ({sanityClient}) => {
    const asset = await sanityClient.assets.upload(
      'image',
      createReadStream(path.join(__dirname, '..', '..', 'resources', 'capybara.jpg')),
      {
        filename: 'image-array-drag.jpg',
        title: 'image-array-drag',
      },
    )
    uploadedAsset = asset
  })

  test.afterAll(async ({sanityClient}) => {
    await sanityClient.delete(uploadedAsset._id)
  })

  test('Portable Text Input - Array Input of images dragging an image will not trigger range out of bounds (toast)', async ({
    page,
    createDraftDocument,
  }, testInfo) => {
    await withCrashRecovery(page, testInfo, async () => {
      await createDraftDocument(
        '/test/content/input-standard;portable-text;pt_allTheBellsAndWhistles',
      )

      await expect(page.getByPlaceholder('Enter a title')).toBeVisible(expectConfig)
      await expect(page.getByPlaceholder('Enter a title')).toBeEnabled(expectConfig)

      // set up the portable text editor
      await expect(page.getByTestId('field-body')).toBeVisible(expectConfig)
      await page.getByTestId('field-body').focus()
      await page.getByTestId('field-body').click()

      // eslint-disable-next-line max-nested-callbacks
      page.on('dialog', async () => {
        await expect(page.getByTestId('insert-menu-auto-collapse-menu')).toBeVisible(expectConfig)
      })

      // open the insert menu
      const insertImageButton = page
        .getByTestId('insert-menu-auto-collapse-menu')
        .getByRole('button', {name: 'Insert Image slideshow (block)'})

      // 1. Wait until it's in the DOM and visible (Playwright will retry this)
      await expect(insertImageButton).toBeVisible(expectConfig)
      await expect(insertImageButton).toBeAttached(expectConfig)

      // 3. Now it's interactable and safe to click
      await insertImageButton.click()

      // set up for the PTE block
      await page.getByRole('button', {name: 'Add item'}).click()
      await page.getByTestId('file-input-multi-browse-button').click()
      await page.getByTestId('file-input-browse-button-sanity-default').click()

      // grab an image
      await page.getByRole('button', {name: uploadedAsset.originalFilename}).click()
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
  })
})
