import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test('media plugin should open from input', async ({page, createDraftDocument}) => {
  await createDraftDocument('/content/input-standard;imagesTest')

  // wait for input to be visible
  await expect(await page.getByTestId('change-bar__field-wrapper').nth(2)).toBeVisible()

  // wait for menu to be visible and click menu button
  await expect(await page.locator('#mainImage_assetImageButton')).toBeVisible()
  await page.locator('#mainImage_assetImageButton').click()

  // wait for menu to open, click the menu item for media
  await expect(await page.getByTestId('file-input-browse-button-media')).toBeVisible()
  await page.getByTestId('file-input-browse-button-media').click()

  // check that it didn't crash
  await expect(await page.getByRole('button', {name: 'Insert image imagesTest'})).toBeVisible()
})

test('open media plugin from navbar', async ({page, createDraftDocument}) => {
  await createDraftDocument('/')
  await expect(page.getByTestId('parent-config-studio-tool-menu')).toBeVisible()

  // click media plugin
  await page.getByRole('link', {name: 'Media'}).click()

  // check that it didn't crash
  await expect(await page.getByRole('button', {name: 'Browse Assets Upload assets'})).toBeVisible()
})
