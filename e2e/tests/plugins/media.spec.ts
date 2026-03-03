import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test('media plugin should open from input', async ({page, createDraftDocument}) => {
  test.slow()
  await createDraftDocument('/content/input-standard;imagesTest')

  // wait for input to be visible
  await expect(page.getByTestId('change-bar__field-wrapper').nth(2)).toBeVisible()

  // wait for menu to be visible and click menu button
  const fieldWrapper = page.getByTestId('change-bar__field-wrapper').nth(2)
  await expect(fieldWrapper.getByTestId(/image-object-input-multi-browse-button/)).toBeVisible()
  await fieldWrapper.getByTestId(/image-object-input-multi-browse-button/).click()

  // wait for menu to open, click the menu item for media
  await expect(page.getByTestId('image-object-input-browse-button-media')).toBeVisible()
  await expect(page.getByTestId('image-object-input-browse-button-media')).toBeEnabled()
  await page.getByTestId('image-object-input-browse-button-media').click()

  // check that it didn't crash
  await expect(page.getByRole('button', {name: 'Insert image imagesTest'})).toBeVisible()
})

test('open media plugin from navbar', async ({page}) => {
  test.slow()
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
