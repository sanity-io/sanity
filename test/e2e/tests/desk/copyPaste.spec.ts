import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test.describe('copy and pasting of fields', () => {
  test(`its able to copy a object field successfully`, async ({page, createDraftDocument}) => {
    await createDraftDocument('/test/content/input-standard;objectsTest')

    expect(page.getByTestId(`field-objectWithColumns`)).toBeVisible()

    const $objectWrapper = page
      .getByTestId('field-objectWithColumns')
      .locator(`[tabindex="0"]`)
      .first()

    await expect($objectWrapper).toBeVisible()

    await page.getByTestId('field-objectWithColumns.string1').locator('input').focus()

    await page.keyboard.type('A string to copy')

    await $objectWrapper.focus()

    await expect($objectWrapper).toBeFocused()

    // https://github.com/microsoft/playwright/pull/30572
    // maybe part of 1.44
    // await page.keyboard.press('ControlOrMeta+C')
    await page.keyboard.press('Meta+C')

    await expect(page.getByText(`Field Object with columns copied`)).toBeVisible()
  })
})
