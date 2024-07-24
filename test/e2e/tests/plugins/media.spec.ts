import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test('media plugin should open', async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/input-standard;imagesTest')
  const imageInput = page.getByTestId('change-bar__field-wrapper').nth(2)

  expect(await imageInput).toBeVisible()

  expect(await page.locator('#mainImage_assetImageButton')).toBeVisible()
  await page.locator('#mainImage_assetImageButton').click()

  expect(await page.getByTestId('file-input-multi-button-media')).toBeVisible()
  await page.getByTestId('file-input-browse-button-media').click()

  expect(await page.getByTestId('virtuoso-scroller')).toBeVisible()
})
