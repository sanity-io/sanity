import {expect} from '@playwright/test'

import {retryingClickUntilVisible} from '../../helpers/retryingClick'
import {test} from '../../studio-test'

test('media plugin should open from input', async ({page, createDraftDocument}) => {
  await createDraftDocument('/content/input-standard;imagesTest')

  // wait for input to be visible (nth(1) = mainImage, first image field in imagesTest schema)
  await expect(page.getByTestId('change-bar__field-wrapper').nth(1)).toBeVisible()

  // wait for menu to be visible and click menu button
  const fieldWrapper = page.getByTestId('change-bar__field-wrapper').nth(1)
  const browseButton = fieldWrapper.getByTestId(/image-object-input-multi-browse-button/)
  await expect(browseButton).toBeVisible()

  const mediaMenuItem = page.getByTestId('image-object-input-browse-button-media')
  await retryingClickUntilVisible(page, browseButton, mediaMenuItem)

  // click the menu item for media
  await expect(mediaMenuItem).toBeEnabled()
  await mediaMenuItem.click()

  // check that it didn't crash
  await expect(page.getByRole('button', {name: 'Insert image imagesTest'})).toBeVisible()
})

test('open media plugin from navbar', async ({page}) => {
  await page.goto('/')
  await expect(page.getByTestId('parent-config-studio-tool-menu')).toBeVisible()

  // click media plugin
  await expect(
    page.getByTestId('tool-collapse-menu').getByRole('link', {name: 'Media'}),
  ).toBeVisible()
  await page.getByTestId('tool-collapse-menu').getByRole('link', {name: 'Media'}).click()

  // check that it didn't crash
  await expect(page.getByRole('button', {name: 'Browse Assets Upload assets'})).toBeVisible()
})
